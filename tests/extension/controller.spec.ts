import { test, expect } from './fixture';
test('page mutation and SPA navigation invalidate scope without duplicate injection',async({page,activate})=>{
 await page.goto('http://127.0.0.1:4173/');await activate(page);
 await page.evaluate(()=>{const b=document.createElement('button');b.textContent='SPA insertion';document.body.append(b)});
 await expect(page.getByText('Page changed; run a new scan.',{exact:true})).toBeVisible();
 await page.evaluate(()=>history.pushState({},'', '/?spa=1'));await expect(page.getByText('Page URL changed; run a new scan.',{exact:true})).toBeVisible();
 await activate(page);await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
});
test('controller stays isolated between tabs and resets on reload',async({page,context,activate})=>{
 await page.goto('http://127.0.0.1:4173/');await activate(page);const other=await context.newPage();await other.goto('http://127.0.0.1:4173/?other');await expect(other.locator('[data-accesslab-root]')).toHaveCount(0);await activate(other);await page.getByRole('button',{name:'Close AccessLab'}).click();await expect(other.locator('[data-accesslab-root]')).toHaveCount(1);await other.reload();await expect(other.locator('[data-accesslab-root]')).toHaveCount(0);
});
test('shadow styles resist hostile host CSS',async({page,activate})=>{
 await page.goto('http://127.0.0.1:4173/');await page.addStyleTag({content:'p,button{font-size:1px!important;color:transparent!important;background:red!important}'});await activate(page);
 await expect(page.getByRole('button',{name:'Close AccessLab'})).toBeVisible();expect(await page.getByRole('button',{name:'Close AccessLab'}).evaluate(e=>getComputedStyle(e).fontSize)).toBe('14px');
});
test('real controller overlay follows transformed scrolling target and removes disconnected target',async({page,activate,worker})=>{
 await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{document.body.style.height='2000px';document.querySelector('h1')!.setAttribute('style','transform:translate(30px,500px) scale(1.2)')});await activate(page);
 await worker.evaluate(async()=>{
  const api=globalThis as unknown as {chrome:{tabs:{query:(x:object)=>Promise<{id:number;url:string}[]>};scripting:{executeScript:(x:object)=>Promise<unknown>}}};const tab=(await api.chrome.tabs.query({})).find(t=>t.url?.startsWith('http://127.0.0.1:4173/'))!;
  await api.chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{const g=globalThis as unknown as {__accesslabController:{locate:(e:Element|null)=>void}};g.__accesslabController.locate(document.querySelector('h1'));}});
 });
 const target=await page.getByRole('heading',{name:'AccessLab demo',exact:true}).boundingBox();const outline=await page.locator('[data-accesslab-overlay] .outline').boundingBox();expect(outline!.x).toBeCloseTo(target!.x,0);expect(outline!.y).toBeCloseTo(target!.y,0);expect(outline!.width).toBeCloseTo(target!.width,0);
 await page.evaluate(()=>{document.querySelector('h1')!.remove();window.dispatchEvent(new Event('resize'))});await expect(page.locator('[data-accesslab-overlay] .outline')).toHaveCount(0);
});
