from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'scripts/build';Q=ROOT/'docs/verification';Q.mkdir(exist_ok=True)
p=json.loads((D/'Materia.maxpat').read_text())['patcher'];p['title']='Materia Native QA'
def obj(i,t,ni=1,no=1,**kw):p['boxes'].append({'box':dict(id=i,maxclass='newobj',text=t,numinlets=ni,numoutlets=no,patching_rect=[20,3500+len(p['boxes'])*2,300,22],**kw)})
def wire(a,b,o=0,i=0):p['lines'].append({'patchline':dict(source=[a,o],destination=[b,i])})
obj('qa','v8 materia.qa.js',varname='qa');obj('qainit','loadbang');obj('err','error 1',no=2);obj('errprefix','prepend logerror');obj('udp','udpreceive 7473');wire('qainit','qa');wire('err','errprefix');wire('errprefix','qa');wire('udp','qa')
obj('testtone','cycle~ 220');obj('testlevel','*~ 0.25',ni=2,varname='testlevel');wire('testtone','testlevel');wire('testlevel','input');wire('testlevel','input',0,1)
obj('record','sfrecord~ 8',ni=8,varname='record');wire('dsp','record');wire('dsp','record',1,1)

for n in range(4):wire('dsp','record',n+2,n+2)
wire('testlevel','record',0,6)
wire('testtone','record',0,7)
obj('dacon','dac~',ni=2,varname='dacon') # no speaker signal connections
(D/'Materia Native QA.maxpat').write_text(json.dumps({'patcher':p},indent=2))
(D/'materia.qa.js').write_text('var ROOT='+json.dumps(str(Q))+';\nvar SCHEMA='+json.dumps(json.loads((D/'schema.json').read_text()))+';\n'+(ROOT/'scripts/native_qa.js').read_text())
print(D/'Materia Native QA.maxpat')
