import { test, expect } from './fixture';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
test('panel keyboard navigation, collapse, dock and close restore page focus',async({page,activate})=>{
 await page.goto('http://127.0.0.1:4173/');await page.evaluate(()=>{const b=document.createElement('button');b.id='prior';b.textContent='Prior page focus';document.body.append(b);b.focus()});await activate(page);
 await page.getByRole('tab',{name:'Audit'}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Inspect'})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Preview'})).toBeFocused();
 await page.getByRole('button',{name:'Dock left'}).click();expect((await page.locator('[data-accesslab-root]').boundingBox())!.x).toBe(12);
 await page.getByRole('button',{name:'Collapse'}).click();await page.getByRole('button',{name:'Reopen AccessLab'}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.getByRole('status')).toContainText('Reset complete');
 await page.getByRole('button',{name:'Close AccessLab'}).focus();await page.keyboard.press('Escape');await expect(page.locator('[data-accesslab-root]')).toHaveCount(0);await expect(page.locator('#prior')).toBeFocused();
});
test('panel separately passes axe and stays usable at 200% layout scale',async({page,activate})=>{
 await page.goto('http://127.0.0.1:4173/');await activate(page);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const ids=await page.evaluate(async()=>{const a=window as unknown as {axe:{run:(ctx:unknown,opts:unknown)=>Promise<{violations:{id:string}[]}>}};return (await a.axe.run(document.querySelector('[data-accesslab-root]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})).violations.map(v=>v.id)});expect(ids).toEqual([]);
 await page.evaluate(()=>document.documentElement.style.zoom='2');const box=await page.locator('[data-accesslab-root]').boundingBox();expect(box!.width).toBeLessThanOrEqual(1280);await expect(page.getByRole('button',{name:'Close AccessLab'})).toBeVisible();
});
test('@visual panel baseline active and reset artifacts preserve host layout',async({page,activate},info)=>{
 await page.goto('http://127.0.0.1:4173/');const before=await page.locator('h1').boundingBox();await page.screenshot({path:info.outputPath('baseline.png')});await activate(page);await page.screenshot({path:info.outputPath('active.png')});expect(await page.locator('h1').filter({hasText:'AccessLab demo'}).boundingBox()).toEqual(before);await page.getByRole('button',{name:'Close AccessLab'}).click();await page.screenshot({path:info.outputPath('reset.png')});expect(await page.locator('h1').boundingBox()).toEqual(before);
});
