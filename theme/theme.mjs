// Node twin of theme.py for the Fluxion build. theme.json stays the single source.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SPEC = JSON.parse(readFileSync(path.join(here, 'theme.json'), 'utf8'));
const roles = Object.entries(SPEC.roles);
export const LIVE = Object.fromEntries(roles.map(([k, v]) => [k, v[0]]));
export const FALLBACK = Object.fromEntries(roles.map(([k, v]) => [k, v[1]]));
export const FONT = SPEC.font.family;
export function prelude(prefix) {
  const data = { live: LIVE, fallback: FALLBACK, font: FONT, size: SPEC.font.label, readout: SPEC.font.readout, fieldset: SPEC.fieldset };
  return `// Generated from theme/theme.json for ${prefix}. Do not edit; rebuild instead.\n` +
    readFileSync(path.join(here, 'jsui/theme.js'), 'utf8').replace('/*__THEME__*/null', JSON.stringify(data));
}
