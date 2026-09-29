import json, sys, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'scripts'))
from freeze import freeze
V = dict(major=9, minor=0, revision=9, architecture='x64', modernui=1)
B = [
 {'box': dict(id='n', maxclass='newobj', text='node.script /Users/scragz/Projects/max/coagula/tests/smoke/coagula-smoke.js @autostart 1', patching_rect=[20, 100, 300, 22], numinlets=1, numoutlets=2, outlettype=['', ''],
              saved_object_attributes=dict(autostart=1, defer=0, watch=0))},
 {'box': dict(id='drop', maxclass='live.drop', patching_rect=[20, 20, 200, 60], presentation=1, presentation_rect=[10, 10, 200, 60], numinlets=1, numoutlets=1, outlettype=[''], varname='drop', parameter_enable=1,
              saved_attribute_attributes={'valueof': dict(parameter_longname='Sample', parameter_shortname='Sample', parameter_type=4, parameter_invisible=1)})},
 {'box': dict(id='pre', maxclass='newobj', text='prepend drop', patching_rect=[240, 60, 100, 22], numinlets=1, numoutlets=1)},
 {'box': dict(id='name', maxclass='newobj', text='loadmess buf ---coag', patching_rect=[360, 60, 150, 22], numinlets=1, numoutlets=1)},
 {'box': dict(id='out', maxclass='newobj', text='plugout~', patching_rect=[20, 200, 60, 22], numinlets=2, numoutlets=2)},
 {'box': dict(id='p', maxclass='newobj', text='print SMOKE', patching_rect=[20, 150, 80, 22], numinlets=1, numoutlets=0)},
 {'box': dict(id='log', maxclass='newobj', text='js coagula-smokelog.js', patching_rect=[400, 200, 150, 22], numinlets=1, numoutlets=0, saved_object_attributes=dict(filename='coagula-smokelog.js', parameter_enable=0))},
 {'box': dict(id='lb', maxclass='newobj', text='loadbang', patching_rect=[400, 100, 60, 22], numinlets=1, numoutlets=1)},
 {'box': dict(id='del', maxclass='newobj', text='delay 3000', patching_rect=[400, 130, 60, 22], numinlets=2, numoutlets=1)},
 {'box': dict(id='m', maxclass='message', text='probe', patching_rect=[480, 160, 60, 22], numinlets=2, numoutlets=1)},
 {'box': dict(id='st', maxclass='message', text='script start', patching_rect=[560, 160, 80, 22], numinlets=2, numoutlets=1)},
 {'box': dict(id='pre2', maxclass='newobj', text='prepend status', patching_rect=[300, 160, 90, 22], numinlets=1, numoutlets=1)},
]
L = [{'patchline': dict(source=['lb', 0], destination=['m', 0])}, {'patchline': dict(source=['m', 0], destination=['log', 0])},
     {'patchline': dict(source=['lb', 0], destination=['del', 0])}, {'patchline': dict(source=['del', 0], destination=['st', 0])},
     {'patchline': dict(source=['st', 0], destination=['n', 0])}, {'patchline': dict(source=['n', 0], destination=['log', 0])},
     {'patchline': dict(source=['n', 1], destination=['pre2', 0])}, {'patchline': dict(source=['pre2', 0], destination=['log', 0])},{'patchline': dict(source=['drop', 0], destination=['pre', 0])}, {'patchline': dict(source=['pre', 0], destination=['n', 0])},
     {'patchline': dict(source=['name', 0], destination=['n', 0])}, {'patchline': dict(source=['n', 0], destination=['p', 0])}]
patch = dict(fileversion=1, appversion=V, classnamespace='box', rect=[60, 80, 800, 500], openrect=[0, 0, 300, 169], devicewidth=300,
             openinpresentation=1, boxes=B, lines=L, parameters={}, autosave=0, title='CoagulaSmoke', latency=0,
             dependency_cache=[dict(name='coagula-smoke.js', type='TEXT', implicit=1), dict(name='coagula-smokelog.js', type='TEXT', implicit=1)])
raw = (json.dumps({'patcher': patch}, indent=2) + '\n').encode()
amxd = freeze('CoagulaSmoke3.amxd', raw + b'\0', [(n, 'TEXT', (HERE / n).read_bytes()) for n in ['coagula-smoke.js', 'coagula-smokelog.js']], b'iiii', int(time.time()) + 2082844800)
(HERE / 'CoagulaSmoke3.amxd').write_bytes(amxd)
print('ok', len(amxd))
