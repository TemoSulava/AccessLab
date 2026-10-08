import json,sys
from pathlib import Path
p=Path('docs/tasks/status.json');s=json.loads(p.read_text());t=next(x for x in s['tasks'] if x['id']==sys.argv[1]);assert all(next(x for x in s['tasks'] if x['id']==d)['state']=='done' for d in t['dependencies']);t['state']='in_progress';t['blockedReason']=None;s['checkpoint']=sys.argv[1]+' implementation in progress';p.write_text(json.dumps(s,indent=2)+'\n')
