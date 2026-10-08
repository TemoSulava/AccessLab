import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Panel } from './Panel';
import { panelStyles } from './styles';
import type { PageController } from '../runtime/controller';
export function mountPanel(controller:PageController,docsUrl:string){
 const style=controller.document.createElement('style');style.textContent=panelStyles;controller.shadow.append(style);
 const mount=controller.document.createElement('div');controller.shadow.append(mount);const root=createRoot(mount);flushSync(()=>root.render(<Panel controller={controller} docsUrl={docsUrl}/>));controller.effects.add(()=>root.unmount());
 const sync=()=>{const state=controller.getState();controller.host.dataset.dock=state.dock;controller.host.dataset.collapsed=String(state.collapsed);};sync();controller.effects.add(controller.subscribe(sync));
}
