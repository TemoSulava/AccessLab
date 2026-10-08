import { describe, it, expect } from 'vitest';
import { commandSchema, ackSchema, parseCommand, preferencesSchema, trustedSender, withTimeout, reportSchema } from '../../packages/contracts/src';
const command = { schemaVersion: 1, requestId: 'test-1', type: 'get-state', payload: {} };
describe('strict message boundaries', () => {
  it('accepts supported messages and rejects hostile envelopes', () => {
    expect(commandSchema.parse(command)).toEqual(command);
    for (const bad of [null, [], {...command,schemaVersion:2}, {...command,type:'eval'}, {...command,payload:{code:'bad'}}, {...command,extra:1}, {...command,requestId:'x'.repeat(20000)}]) expect(parseCommand(bad)).toBeNull();
    expect(() => ackSchema.parse({...command,type:'ack',payload:{active:true,state:'idle'}})).not.toThrow();
    expect(() => ackSchema.parse({...command,type:'ack',payload:{active:true,state:'madeup'}})).toThrow();
  });
  it('checks sender identity and frame/tab', () => {
    expect(trustedSender({id:'ext',tab:{id:3},frameId:0},'ext',{tabId:3,frameId:0})).toBe(true);
    expect(trustedSender({id:'other'},'ext')).toBe(false);
    expect(trustedSender({id:'ext',tab:{id:3},frameId:1},'ext',{tabId:3,frameId:0})).toBe(false);
  });
  it('times out and accepts actual replies', async () => {
    await expect(withTimeout(new Promise(() => {}), 5)).rejects.toThrow('TIMEOUT');
    await expect(withTimeout(Promise.resolve(42), 5)).resolves.toBe(42);
  });
  it('validates preference version/types and report version', () => {
    expect(() => preferencesSchema.parse({schemaVersion:1,dock:'right',targetThreshold:24,blur:2})).not.toThrow();
    expect(() => preferencesSchema.parse({schemaVersion:1,dock:'right',targetThreshold:'24',blur:2})).toThrow();
    expect(() => reportSchema.parse({schemaVersion:2})).toThrow();
  });
});
