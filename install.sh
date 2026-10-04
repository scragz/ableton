#!/usr/bin/env bash
# Copy built Grimoire devices (<folder>/device/<Name>.amxd) into ./dist and the Ableton User Library.
#
#   ./install.sh                 dist + library, every device in DEVICES
#   ./install.sh krisis syzygy   dist gets everything; library gets only these (folder names)
#   ./install.sh -n              dry run
#
# ./dist is flat (dist/<Name>.amxd) and always mirrors every built device; stale .amxd removed.
# Library: $ABLETON_USER_LIBRARY/<Category>/$GRIMOIRE_SUBDIR/<Name>.amxd, category from the
# .amxd header devicecode (bytes 8-11): aaaa -> Effects, iiii -> Instruments, mmmm -> MIDI Effects.
# Unchanged files are skipped. Does not build: run each device's build script first.
set -eo pipefail  # no -u: empty arrays trip it on macOS bash 3.2

LIB="${ABLETON_USER_LIBRARY:-$HOME/Music/Ableton/User Library}"
SUBDIR="${GRIMOIRE_SUBDIR:-Grimoire}"

# Relative to this script. Add new devices here.
DEVICES=(
  atomism/device/Atomism.amxd
  calcinatio/device/Calcinatio.amxd
  chiasmus/device/Chiasmus.amxd
  krisis/device/Krisis.amxd
  materia/device/Materia.amxd
  autocatalysis/device/Autocatalysis.amxd
  coagula/device/Coagula.amxd
  hypna/device/Hypna.amxd
  soma/device/Soma.amxd
  syzygy/device/Syzygy.amxd
  vermiform/device/Vermiform.amxd
  vril/device/Vril.amxd
  fluxion/device/Fluxion.amxd
)

DRY=0
FILTER=()
for arg in "$@"; do
  case "$arg" in
    -n|--dry-run) DRY=1 ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) FILTER+=("$(printf '%s' "$arg" | tr '[:upper:]' '[:lower:]')") ;;
  esac
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"

HAVE_LIB=1
if [ ! -d "$LIB" ]; then
  echo "User Library not found: $LIB (set ABLETON_USER_LIBRARY) — dist only" >&2
  HAVE_LIB=0
fi

wanted() {
  [ ${#FILTER[@]} -eq 0 ] && return 0
  local f
  for f in "${FILTER[@]}"; do [ "$f" = "$1" ] && return 0; done
  return 1
}

# put <src> <dest> <label>: copy unless byte-identical; sets PUT=copied|same
put() {
  if [ -f "$2" ] && cmp -s "$1" "$2"; then
    PUT=same; echo "same     $3"; return
  fi
  PUT=copied; echo "copy     $3"
  if [ "$DRY" -eq 0 ]; then
    mkdir -p "$(dirname "$2")"
    cp "$1" "$2"
  fi
}

copied=0; same=0; missing=0; matched=0; removed=0
KEEP=" "
for rel in "${DEVICES[@]}"; do
  folder="${rel%%/*}"
  src="$ROOT/$rel"
  name="$(basename "$rel")"
  KEEP="$KEEP$name "
  wanted "$folder" && matched=$((matched + 1))

  if [ ! -f "$src" ]; then
    echo "MISSING  $rel  (cd $folder && build first)"
    missing=$((missing + 1)); continue
  fi

  code="$(head -c 12 "$src" | tail -c 4)"
  case "$code" in
    aaaa) cat="Effects" ;;
    iiii) cat="Instruments" ;;
    mmmm) cat="MIDI Effects" ;;
    *) echo "SKIP     $rel  (unknown devicecode '$code')"; missing=$((missing + 1)); continue ;;
  esac

  put "$src" "$DIST/$name" "dist/$name"
  [ "$PUT" = copied ] && copied=$((copied + 1)) || same=$((same + 1))

  if [ "$HAVE_LIB" -eq 1 ] && wanted "$folder"; then
    put "$src" "$LIB/$cat/$SUBDIR/$name" "$cat/$SUBDIR/$name"
    [ "$PUT" = copied ] && copied=$((copied + 1)) || same=$((same + 1))
  fi
done

# Drop .amxd files in dist that are no longer in DEVICES.
if [ -d "$DIST" ]; then
  for f in "$DIST"/*.amxd; do
    [ -e "$f" ] || continue
    case "$KEEP" in *" $(basename "$f") "*) continue ;; esac
    echo "remove   dist/$(basename "$f")"
    [ "$DRY" -eq 0 ] && rm -f "$f"
    removed=$((removed + 1))
  done
fi

if [ ${#FILTER[@]} -gt 0 ] && [ "$matched" -eq 0 ]; then
  echo "no device matched: ${FILTER[*]}" >&2; exit 2
fi

[ "$DRY" -eq 1 ] && echo "(dry run)"
echo "$copied copied, $same unchanged, $removed removed, $missing missing"
[ "$missing" -eq 0 ]
