import { test, expect } from './fixture';
test('real bundled extension activates once', async ({ page, activate }) => {
  await page.goto('http://127.0.0.1:4173/'); await activate(page);
  await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
  await expect(page.getByText('AccessLab is active')).toBeVisible();
  await activate(page); await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
});
test('worker/content messages acknowledge valid state and reject invalid commands', async ({ page, activate, worker }) => {
  await page.goto('http://127.0.0.1:4173/'); await activate(page);
  const replies = await worker.evaluate(async url => {
    const api = globalThis as unknown as { chrome: { tabs: { query: (x:object) => Promise<{id:number;url:string}[]>; sendMessage:(id:number,value:unknown,options:object)=>Promise<unknown> } } };
    const tab = (await api.chrome.tabs.query({})).find(t => t.url === url)!;
    const results = [];
    for (const value of [{schemaVersion:1,requestId:'valid',type:'get-state',payload:{}},{schemaVersion:2,requestId:'bad',type:'activate',payload:{}},{schemaVersion:1,requestId:'bad',type:'activate',payload:{evil:'x'.repeat(20000)}}]) {
      results.push(await api.chrome.tabs.sendMessage(tab.id,value,{frameId:0}));
    }
    return results;
  },page.url());
  expect(replies[0]).toMatchObject({requestId:'valid',type:'ack',payload:{active:true,state:'idle'}});
  expect(replies[1]).toBeUndefined(); expect(replies[2]).toBeUndefined();
});
test('owned DOM and message listeners clean up across repeated activation', async ({ page, activate }) => {
 await page.goto('http://127.0.0.1:4173/');
 for(let i=0;i<20;i++) { await activate(page); await page.getByRole('button',{name:'Close AccessLab'}).click(); await expect(page.locator('[data-accesslab-root]')).toHaveCount(0); }
 await activate(page); await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
});
