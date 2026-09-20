"""Build an isolated Live audio fixture using the production patch and defaults."""
import json
from pathlib import Path
from build import STAGE, ROOT, DEPENDENCIES, freeze_amxd
p=json.loads((STAGE/'Materia.maxpat').read_text())['patcher']
p['title']='Materia Regression QA'
def obj(i,t,ni=1,no=1,**kw):
 p['boxes'].append({'box':dict(id=i,maxclass='newobj',text=t,numinlets=ni,numoutlets=no,patching_rect=[20,4000+len(p['boxes'])*2,300,22],**kw)})
def wire(a,b,o=0,i=0):p['lines'].append({'patchline':dict(source=[a,o],destination=[b,i])})
# Independent channels reveal wrong destination defaults and cross-channel leakage.
for i,f in enumerate([220,329]):
 obj('tone'+str(i),f'cycle~ {f}');obj('level'+str(i),'*~ 0.25',ni=2)
 wire('tone'+str(i),'level'+str(i));wire('level'+str(i),'input',0,i)
obj('regrecord','sfrecord~ 4',ni=4,varname='regrecord')
for i in range(2):wire('dsp','regrecord',i,i);wire('level'+str(i),'regrecord',0,i+2)
# Record outputs internally; keep synthetic test tones out of the user's speakers.
p['lines']=[l for l in p['lines'] if l['patchline']['destination'][0]!='output']
obj('regqa','v8 materia.regression.js',varname='regqa');obj('regload','loadbang');wire('regload','regqa')
obj('regbind','loadmess bind ---materia_meters');wire('regbind','regqa')
obj('regcommands','udpreceive 7484');wire('regcommands','regqa')
(STAGE/'materia.regression.js').write_text('var ROOT='+json.dumps(str(ROOT/'docs/verification'))+';\n'+(ROOT/'scripts/regression_qa.js').read_text())
raw=json.dumps({'patcher':p},indent=2).encode()
(STAGE/'Materia Regression QA.maxpat').write_bytes(raw)
(STAGE/'Materia Regression QA.amxd').write_bytes(freeze_amxd('Materia Regression QA.amxd',raw+b'\0',DEPENDENCIES+[('materia.regression.js','TEXT')]))
print(STAGE/'Materia Regression QA.amxd')
