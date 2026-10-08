import { useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import type { PageController } from '../runtime/controller';
export function Panel({controller,docsUrl}: {controller:PageController;docsUrl:string}) {
 const state=useSyncExternalStore(controller.subscribe,controller.getState);const [tab,setTab]=useState('Audit');
 const tabs=['Audit','Inspect','Preview'];
 function tabKeys(event:KeyboardEvent<HTMLButtonElement>,index:number){let next=index;if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;else return;event.preventDefault();setTab(tabs[next]);(event.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();}
 if(state.collapsed)return <button className="reopen" onClick={()=>controller.open()}>Reopen AccessLab</button>;
 return <aside className="panel" aria-label="AccessLab inspection panel" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();event.preventDefault();void controller.close();}}}>
  <header><div className="brand"><h1>AccessLab</h1><span aria-label="Version 0.1">v0.1</span></div><p className="subtitle">Find barriers. Inspect the cause. Verify the fix.</p>
   <div className="tools"><button onClick={()=>controller.update({dock:state.dock==='right'?'left':'right'})}>Dock {state.dock==='right'?'left':'right'}</button><button onClick={()=>controller.update({collapsed:true})}>Collapse</button><button onClick={()=>{void controller.reset()}}>Reset</button><button onClick={()=>{void controller.close()}}>Close AccessLab</button></div>
   <p className="scope">Top document · {controller.document.location.host}{controller.document.location.pathname}</p>
  </header>
  <nav aria-label="Inspection tools" role="tablist">{tabs.map((name,index)=><button key={name} id={`tab-${name}`} role="tab" aria-selected={tab===name} aria-controls={`view-${name}`} tabIndex={tab===name?0:-1} onClick={()=>setTab(name)} onKeyDown={event=>tabKeys(event,index)}>{name}</button>)}</nav>
  <p className="status" role="status" aria-live="polite" aria-atomic="true">{state.message}</p>
  <section className="content" id={`view-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
   {tab==='Audit'&&<><h2>Automated audit</h2><p>Check the current page with locally bundled axe-core.</p><button className="primary" disabled>Run audit</button><p className="notice">No scan yet. Automated checks cover only part of accessibility; manual checks remain.</p>{state.status==='error'&&<p role="alert">The scan failed. Retry after resolving the reported error.</p>}</>}
   {tab==='Inspect'&&<><h2>Inspect interaction</h2><p>Observe actual keyboard focus visits and inspect target dimensions in CSS pixels.</p><p className="notice">No inspections active.</p></>}
   {tab==='Preview'&&<><h2>Rendering previews</h2><p>Selected effects illustrate rendering differences. They do not reproduce a person’s lived experience.</p><p className="notice">No preview active.</p></>}
  </section>
  <footer>Top document only. Iframes and closed shadow roots are outside supported coverage. <a href={docsUrl} target="_blank" rel="noopener noreferrer">Scope &amp; local documentation</a></footer>
 </aside>;
}
