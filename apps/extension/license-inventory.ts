import { existsSync,readFileSync } from 'node:fs';
import { dirname,join,parse } from 'node:path';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';
// Record packages actually retained in each production bundle, never machine paths.
export function licenseInventory():Plugin{return{name:'accesslab-license-inventory',generateBundle(_options,bundle){
 const packages=new Map<string,{name:string;version:string;license:string}>();
 for(const output of Object.values(bundle))if(output.type==='chunk')for(const [id,module] of Object.entries(output.modules)){
  if(!module.renderedLength||!id.includes('node_modules'))continue;let dir=dirname(id.split('?')[0]);
  while(dir!==parse(dir).root){const manifest=join(dir,'package.json');if(existsSync(manifest)){
   const pkg=JSON.parse(readFileSync(manifest,'utf8')) as {name:string;version:string;license:string};if(!pkg.name)break;
   const name=pkg.name.replace(/[^a-zA-Z0-9._-]/g,'-');packages.set(pkg.name,{name:pkg.name,version:pkg.version,license:pkg.license});
   let license=['LICENSE','LICENSE.md','LICENSE.txt','license','license.md'].map(file=>join(dir,file)).find(existsSync);
   if(!license&&['wxt','@wxt-dev/browser'].includes(pkg.name))license=join(import.meta.dirname,'../../docs/licenses/WXT-MIT.txt');
   if(!license)throw Error(`Missing license text for bundled ${pkg.name}`);
   this.emitFile({type:'asset',fileName:`licenses/${name}.txt`,source:readFileSync(license,'utf8')});break;
  }dir=dirname(dir);}
 }
 if(packages.size){const content=JSON.stringify([...packages.values()].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0),null,2)+'\n';const hash=createHash('sha256').update(content).digest('hex').slice(0,12);this.emitFile({type:'asset',fileName:`licenses/inventory-${hash}.json`,source:content});}
}};}
