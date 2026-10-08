import sys,json,subprocess
from pathlib import Path
id=sys.argv[1]; summary=sys.argv[2]
s=json.loads(Path('docs/tasks/status.json').read_text());t=next(x for x in s['tasks'] if x['id']==id)
for dep in t['dependencies']:
 assert next(x for x in s['tasks'] if x['id']==dep)['state']=='done'
t['state']='verified';s['checkpoint']=f'{id} verified. Next task in dependency order.'
Path('docs/tasks/status.json').write_text(json.dumps(s,indent=2)+'\n')
subprocess.run(['git','add','.'],check=True);subprocess.run(['git','commit','-m',f'{id}: {summary}'],check=True)
t['commit']=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();t['state']='done'
Path('docs/tasks/status.json').write_text(json.dumps(s,indent=2)+'\n')
subprocess.run(['git','add','docs/tasks/status.json'],check=True);subprocess.run(['git','commit','-m',f'docs: record {id} completion'],check=True)
subprocess.run(['git','push','-u','origin','HEAD'],check=True)
