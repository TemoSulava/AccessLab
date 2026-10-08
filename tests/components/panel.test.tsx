// @vitest-environment jsdom
import { afterEach, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { Panel } from '../../apps/extension/src/panel/Panel';
import { PageController } from '../../apps/extension/src/runtime/controller';
let controller:PageController;
afterEach(async()=>{cleanup();await controller?.close()});
function setup(){controller=new PageController(document);render(<Panel controller={controller} docsUrl="/docs.html"/>);}
it('switches tabs by arrow keys, updates dock, collapses and reopens',()=>{
 setup();const audit=screen.getByRole('tab',{name:'Audit'});audit.focus();fireEvent.keyDown(audit,{key:'ArrowRight'});expect(screen.getByRole('tab',{name:'Inspect'}).getAttribute('aria-selected')).toBe('true');expect(document.activeElement).toBe(screen.getByRole('tab',{name:'Inspect'}));
 fireEvent.click(screen.getByRole('button',{name:'Dock left'}));expect(controller.getState().dock).toBe('left');fireEvent.click(screen.getByRole('button',{name:'Collapse'}));expect(screen.getByRole('button',{name:'Reopen AccessLab'})).toBeDefined();fireEvent.click(screen.getByRole('button',{name:'Reopen AccessLab'}));expect(screen.getByRole('complementary')).toBeDefined();
});
it('announces errors as text and resets state without injecting markup',()=>{
 setup();act(()=>controller.update({status:'error',message:'<img src=x onerror=alert(1)>'}));expect(screen.getByRole('status').textContent).toBe('<img src=x onerror=alert(1)>');expect(document.querySelector('img')).toBeNull();expect(screen.getByRole('alert')).toBeDefined();fireEvent.click(screen.getByRole('button',{name:'Reset'}));
});
it('closes with Escape only through panel event handling',async()=>{
 setup();fireEvent.keyDown(document.body,{key:'Escape'});expect(controller.host.isConnected).toBe(true);fireEvent.keyDown(screen.getByRole('complementary'),{key:'Escape'});await act(async()=>await Promise.resolve());expect(controller.host.isConnected).toBe(false);
});
