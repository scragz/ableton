"""Check the serialized contract consumed by Max, not only Python/JS truthiness."""
import json
from pathlib import Path
p=json.loads(Path('scripts/build/Materia.maxpat').read_text())['patcher']
boxes={b['box']['id']:b['box'] for b in p['boxes']}
for key in json.loads(Path('scripts/build/schema.json').read_text()):
 value=boxes[key['key']]['saved_attribute_attributes']['valueof']['parameter_initial'][0]
 assert type(value) in (int,float),(key['key'],value)
assert boxes['da_dest']['saved_attribute_attributes']['valueof']['parameter_initial']==[0]
assert boxes['db_dest']['saved_attribute_attributes']['valueof']['parameter_initial']==[1]
# live.text button mode emits bang; every momentary action must accept that event.
for key,b in boxes.items():
 if b.get('maxclass')=='live.text' and b.get('mode')==0:
  targets=[l['patchline']['destination'][0] for l in p['lines'] if l['patchline']['source']==[key,0]]
  assert len(targets)==1 and boxes[targets[0]]['text']=='t b',key
print('PASS: numeric serialized defaults, L/R destination defaults, and momentary button bang paths')
