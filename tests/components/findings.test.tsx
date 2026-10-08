// @vitest-environment jsdom
import { it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Findings } from '../../apps/extension/src/panel/Findings';
import type { PageController } from '../../apps/extension/src/runtime/controller';
import type { AuditReport, Finding } from '../../packages/contracts/src';
afterEach(cleanup);
it('escapes hostile strings, blocks unsafe help links and paginates all findings',()=>{
 const finding:Finding={id:'x',ruleId:'x',impact:null,description:'<script>',help:'<img src=x onerror=alert(1)>',helpUrl:'javascript:alert(1)',tags:[],reviewStatus:'violation',target:['#a'],elementType:'button',explanation:'<script>evil</script>',suggestion:'Inspect'};
 const report={generation:1,violations:Array.from({length:55},(_,i)=>({...finding,id:String(i)})),needsReview:[]} as unknown as AuditReport;render(<Findings report={report} controller={{locateFinding(){},focusFinding(){}} as unknown as PageController}/>);expect(document.querySelector('img')).toBeNull();expect(document.querySelector('script')).toBeNull();expect(document.querySelector('a')).toBeNull();expect(document.querySelectorAll('article')).toHaveLength(50);fireEvent.click(screen.getByRole('button',{name:'Next findings'}));expect(document.querySelectorAll('article')).toHaveLength(5);fireEvent.change(screen.getByLabelText('Severity'),{target:{value:'critical'}});expect(document.querySelectorAll('article')).toHaveLength(0);
});
