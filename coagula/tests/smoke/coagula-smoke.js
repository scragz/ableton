const Max = require('max-api');
const fs = require('fs');
const os = require('os');
const path = require('path');
const out = path.join(os.homedir(), 'Projects/max/coagula/tests/smoke/result.json');
const info = { file: __filename, dir: __dirname, cwd: process.cwd(), node: process.version, t: Date.now(), msgs: [] };
function dump() { fs.writeFileSync(out, JSON.stringify(info, null, 2)); }
dump();
Max.addHandler(Max.MESSAGE_TYPES.ALL, (...a) => { info.msgs.push(a); dump(); Max.outlet('echo', ...a); });
Max.post('coagula smoke up ' + __filename);
