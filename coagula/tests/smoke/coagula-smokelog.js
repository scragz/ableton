autowatch = 0; inlets = 1; outlets = 0;
var lines = [];
function flush() {
    var f = new File("/Users/scragz/Projects/max/coagula/tests/smoke/log.txt", "write", "TEXT");
    if (f.isopen) { f.eof = 0; for (var i = 0; i < lines.length; i++) f.writeline(lines[i]); f.close(); }
}
function anything() { lines.push(inlet + ' ' + messagename + ' ' + arrayfromargs(arguments).join(' ')); flush(); }
function msg_int(v) { lines.push(inlet + ' int ' + v); flush(); }
function probe() {
    var f = new File("coagula-smoke.js", "read");
    lines.push('probe open=' + f.isopen + ' path=' + f.foldername + ' / ' + f.filename + ' eof=' + f.eof);
    f.close(); flush();
}
