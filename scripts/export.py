#!/usr/bin/env python3
"""Copy built Grimoire devices (<folder>/device/<Name>.amxd) into ./dist and the Ableton User Library.

  scripts/export.py                 dist + library, every device in DEVICES
  scripts/export.py krisis syzygy   dist gets everything; library gets only these (folder names)
  scripts/export.py -n              dry run

./dist is flat (dist/<Name>.amxd) and always mirrors every built device; stale .amxd removed.
Library: $ABLETON_USER_LIBRARY/<Category>/$GRIMOIRE_SUBDIR/<Name>.amxd, category from the
.amxd header devicecode (bytes 8-11): aaaa -> Effects, iiii -> Instruments, mmmm -> MIDI Effects.
Unchanged files are skipped. Does not build: run each device's build script first.
"""
from __future__ import annotations

import argparse
import filecmp
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

# Relative to the repo root. Add new devices here.
DEVICES = [
    "atomism/device/Atomism.amxd",
    "calcinatio/device/Calcinatio.amxd",
    "chiasmus/device/Chiasmus.amxd",
    "krisis/device/Krisis.amxd",
    "materia/device/Materia.amxd",
    "autocatalysis/device/Autocatalysis.amxd",
    "coagula/device/Coagula.amxd",
    "hypna/device/Hypna.amxd",
    "soma/device/Soma.amxd",
    "syzygy/device/Syzygy.amxd",
    "vermiform/device/Vermiform.amxd",
    "vril/device/Vril.amxd",
    "fluxion/device/Fluxion.amxd",
]

CATEGORIES = {
    b"aaaa": "Effects",
    b"iiii": "Instruments",
    b"mmmm": "MIDI Effects",
}


def devicecode(path: Path) -> bytes:
    with path.open("rb") as f:
        return f.read(12)[8:12]


def put(src: Path, dest: Path, label: str, dry: bool) -> bool:
    """Copy src -> dest unless byte-identical. Returns True if copied."""
    if dest.is_file() and filecmp.cmp(src, dest, shallow=False):
        print(f"same     {label}")
        return False
    print(f"copy     {label}")
    if not dry:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    return True


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("-n", "--dry-run", action="store_true", help="print what would happen")
    ap.add_argument("folders", nargs="*", help="limit the library copy to these device folders")
    args = ap.parse_args(argv)

    dry: bool = args.dry_run
    wanted_set = {f.lower() for f in args.folders}

    def wanted(folder: str) -> bool:
        return not wanted_set or folder in wanted_set

    lib = Path(
        os.environ.get("ABLETON_USER_LIBRARY")
        or Path.home() / "Music" / "Ableton" / "User Library"
    )
    subdir = os.environ.get("GRIMOIRE_SUBDIR") or "Grimoire"

    have_lib = lib.is_dir()
    if not have_lib:
        print(f"User Library not found: {lib} (set ABLETON_USER_LIBRARY) — dist only", file=sys.stderr)

    copied = same = missing = matched = removed = 0
    keep: set[str] = set()

    for rel in DEVICES:
        folder = rel.split("/", 1)[0]
        src = ROOT / rel
        name = src.name
        keep.add(name)
        if wanted(folder):
            matched += 1

        if not src.is_file():
            print(f"MISSING  {rel}  (cd {folder} && build first)")
            missing += 1
            continue

        code = devicecode(src)
        cat = CATEGORIES.get(code)
        if cat is None:
            print(f"SKIP     {rel}  (unknown devicecode {code.decode('latin-1')!r})")
            missing += 1
            continue

        if put(src, DIST / name, f"dist/{name}", dry):
            copied += 1
        else:
            same += 1

        if have_lib and wanted(folder):
            if put(src, lib / cat / subdir / name, f"{cat}/{subdir}/{name}", dry):
                copied += 1
            else:
                same += 1

    # Drop .amxd files in dist that are no longer in DEVICES.
    if DIST.is_dir():
        for f in sorted(DIST.glob("*.amxd")):
            if f.name in keep:
                continue
            print(f"remove   dist/{f.name}")
            if not dry:
                f.unlink()
            removed += 1

    if wanted_set and matched == 0:
        print(f"no device matched: {' '.join(args.folders)}", file=sys.stderr)
        return 2

    if dry:
        print("(dry run)")
    print(f"{copied} copied, {same} unchanged, {removed} removed, {missing} missing")
    return 0 if missing == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
