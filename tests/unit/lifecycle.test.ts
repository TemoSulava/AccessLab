import { it, expect } from 'vitest';
import { Effects, Generation, ModuleManager } from '../../packages/core/src';
import type { AccessLabModule } from '../../packages/contracts/src';
const base = { document: {} as Document, overlay: {show:()=>()=>{},clear(){}}, report(){} };
function module(id: string, activate: AccessLabModule<number>['activate'], exclusiveGroup?: string): AccessLabModule<number> { return {id,apiVersion:1,kind:'inspection',capabilities:[],configSchema:{parse:value=>Number(value)},activate,exclusiveGroup}; }
it('disposes in reverse order once and continues after errors', async () => {
 const e=new Effects(), order:number[]=[];e.add(()=>{order.push(1)});e.add(()=>{order.push(2);throw Error('broken')});e.add(()=>{order.push(3)});
 await expect(e.dispose()).rejects.toBeInstanceOf(AggregateError);expect(order).toEqual([3,2,1]);expect(e.size).toBe(0);await e.dispose();expect(order).toEqual([3,2,1]);
});
it('rolls back a partial activation without disabling unrelated module',async()=>{
 const manager=new ModuleManager(base), events:string[]=[];
 manager.register(module('good',async()=>()=>{events.push('good-clean')}));
 manager.register(module('bad',async ctx=>{ctx.effects.add(()=>{events.push('rollback')});throw Error('failed')}));
 await manager.activate('good',1);await expect(manager.activate('bad',1)).rejects.toThrow('failed');expect(events).toEqual(['rollback']);expect(manager.activeIds).toEqual(['good']);await manager.reset();await manager.reset();expect(events).toEqual(['rollback','good-clean']);
});
it('replaces config, enforces exclusive previews and cancels activation during reset',async()=>{
 const manager=new ModuleManager(base), events:string[]=[];
 manager.register(module('a',async(_ctx,n)=>{events.push('a'+n);return()=>{events.push('dispose-a'+n)}},'visual-preview'));
 manager.register(module('b',async()=>()=>{events.push('dispose-b')},'visual-preview'));
 await manager.activate('a',1);await manager.activate('a',2);expect(events).toEqual(['a1','dispose-a1','a2']);await manager.activate('b',1);expect(manager.activeIds).toEqual(['b']);
 let finish:()=>void=()=>{};let signal:AbortSignal|undefined;
 manager.register(module('slow',async ctx=>{signal=ctx.signal;ctx.effects.add(()=>{events.push('early-clean')});await new Promise<void>(resolve=>{finish=resolve});return()=>{events.push('late-clean')}}));
 const pending=manager.activate('slow',1);await new Promise(resolve=>setTimeout(resolve,0));await manager.reset();expect(signal?.aborted).toBe(true);finish();await pending;expect(manager.activeIds).toEqual([]);expect(events).toContain('early-clean');expect(events).toContain('late-clean');
});
it('double concurrent activation keeps only newest resources and generation suppresses late response',async()=>{
 const manager=new ModuleManager(base);let active=0;
 manager.register(module('x',async()=>{active++;return()=>{active--}}));await Promise.all([manager.activate('x',1),manager.activate('x',2)]);expect(active).toBe(1);await manager.reset();expect(active).toBe(0);
 const g=new Generation();const id=g.next();g.invalidate();expect(g.current(id)).toBe(false);
});
it('immediately cleans effects registered after disposal',async()=>{const e=new Effects();await e.dispose();let cleaned=false;e.add(()=>{cleaned=true});await e.dispose();expect(cleaned).toBe(true)});
it('a reset module cannot publish late observations',async()=>{let finish:()=>void=()=>{};let publications=0;const manager=new ModuleManager({...base,report(){publications++}});manager.register(module('delayed-report',async ctx=>{await new Promise<void>(resolve=>{finish=resolve});ctx.report({type:'status',message:'late observation'});return()=>{}}));const pending=manager.activate('delayed-report',1);await new Promise(resolve=>setTimeout(resolve,0));await manager.reset();finish();await pending;expect(publications).toBe(0);});
