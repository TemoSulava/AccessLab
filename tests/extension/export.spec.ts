import { readFile } from 'node:fs/promises';
import { test,expect } from './fixture';
import { readState } from './state';
import { reportSchema } from '../../packages/contracts/src';
test('explicit Blob JSON and Markdown downloads redact sensitive URL/value fields and retain stale scope',async({page,activate,worker})=>{
 await page.goto('http://127.0.0.1:4173/?token=PRIVATE_QUERY#PRIVATE_FRAGMENT');await activate(page);await page.getByRole('button',{name:'Run audit',exact:true}).click();await expect.poll(async()=>(await readState(worker,page.url())).report?.violations.length??0).toBeGreaterThan(0);
 await page.locator('#insert').click();await expect.poll(async()=>(await readState(worker,page.url())).report?.stale).toBe(true);
 await page.getByText('Export report',{exact:true}).click();await page.getByRole('button',{name:'Preview export',exact:true}).click();await expect(page.getByLabel('Export preview',{exact:true})).toBeVisible();await page.screenshot({path:'artifacts/export-preview.png',caret:'initial'});
 for(const format of ['json','markdown']){
  await page.getByLabel('Export format').selectOption(format);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download report',exact:true}).click();const download=await pending;expect(download.suggestedFilename()).toBe(`accesslab-report.${format==='json'?'json':'md'}`);const text=await readFile((await download.path())!,'utf8');expect(text).not.toMatch(/PRIVATE_QUERY|PRIVATE_FRAGMENT|PRIVATE_FIXTURE_VALUE|"html"|"title"|"value"/);
  if(format==='json'){const data=JSON.parse(text);expect(()=>reportSchema.parse(data.audit)).not.toThrow();expect(data.audit.stale).toBe(true);expect(data.audit.scope.excludedFrames).toBe(1);expect(data.observations).toBeUndefined();}else{expect(text).toContain('## Needs manual review');expect(text).toContain('Stale: true');expect(text).not.toContain('<script');}
 }
 await page.getByLabel('Include inspection observations separately').check();const pending=page.waitForEvent('download');await page.getByLabel('Export format').selectOption('json');await page.getByRole('button',{name:'Download report',exact:true}).click();const data=JSON.parse(await readFile((await(await pending).path())!,'utf8'));expect(data.observations.targets).toEqual([]);expect(data.audit.violations.length).toBeGreaterThan(0);
});
