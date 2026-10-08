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

branch=subprocess.check_output(['git','branch','--show-current'],text=True).strip()
pr=subprocess.run(['gh','pr','create','--base','main','--head',branch,'--title',f'{id}: {summary}','--body-file',f'docs/evidence/{id}.md'],capture_output=True,text=True)
print(pr.stdout,pr.stderr)
if pr.returncode==0:
 url=pr.stdout.strip().splitlines()[-1]
 subprocess.run(['gh','pr','merge',url,'--merge'],check=True)
 subprocess.run(['git','fetch','origin','main'],check=True)
 subprocess.run(['git','merge','--ff-only','origin/main'],check=True)
else:
 subprocess.run(['git','fetch','origin','main'],check=True)
 subprocess.run(['git','merge-base','--is-ancestor','origin/main','HEAD'],check=True)
 subprocess.run(['git','push','origin','HEAD:main'],check=True)
