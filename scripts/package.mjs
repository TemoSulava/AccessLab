import { spawnSync } from 'node:child_process';
const result=spawnSync('python3',['-I','scripts/package.py'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
