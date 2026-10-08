export const SCHEMA_VERSION = 1 as const;
export const MESSAGE_BYTES = 16 * 1024;
export const REPORT_BYTES = 5 * 1024 * 1024;
export type ScanState = 'idle' | 'scanning' | 'complete' | 'stale' | 'cancelled' | 'error';
export type Impact = 'minor' | 'moderate' | 'serious' | 'critical' | null;
export type ErrorCode = 'INVALID_MESSAGE' | 'UNSUPPORTED_PAGE' | 'INJECTION_FAILED' | 'TIMEOUT' | 'AUDIT_FAILED' | 'TARGET_UNAVAILABLE';
export interface RuntimeSchema<T> { parse(value: unknown): T; }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value as Record<string, unknown>;
}
export function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).some(key => !keys.includes(key))) throw new Error('Unexpected field');
}
export interface Command { schemaVersion: 1; requestId: string; type: 'activate' | 'get-state'; payload: Record<string, never>; }
export interface Ack { schemaVersion: 1; requestId: string; type: 'ack'; payload: { active: boolean; state: ScanState }; }
const states: ScanState[] = ['idle', 'scanning', 'complete', 'stale', 'cancelled', 'error'];
function envelope(value: unknown) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > MESSAGE_BYTES) throw new Error('Oversized message');
  const v = object(value); exact(v, ['schemaVersion', 'requestId', 'type', 'payload']);
  if (v.schemaVersion !== 1 || typeof v.requestId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(v.requestId)) throw new Error('Invalid envelope');
  return v;
}
export const commandSchema: RuntimeSchema<Command> = { parse(value) {
  const v = envelope(value); if (v.type !== 'activate' && v.type !== 'get-state') throw new Error('Unknown command');
  exact(object(v.payload), []); return v as unknown as Command;
} };
export const ackSchema: RuntimeSchema<Ack> = { parse(value) {
  const v = envelope(value); const p = object(v.payload); exact(p, ['active', 'state']);
  if (v.type !== 'ack' || typeof p.active !== 'boolean' || !states.includes(p.state as ScanState)) throw new Error('Invalid acknowledgement');
  return v as unknown as Ack;
} };
export function parseCommand(value: unknown): Command | null { try { return commandSchema.parse(value); } catch { return null; } }
export function trustedSender(sender: { id?: string; tab?: { id?: number }; frameId?: number }, extensionId: string, expected?: { tabId: number; frameId: number }): boolean {
  return sender.id === extensionId && (!expected || (sender.tab?.id === expected.tabId && sender.frameId === expected.frameId));
}
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('TIMEOUT: no response; try again')), ms); })]); }
  finally { clearTimeout(timer); }
}
export interface Preferences { schemaVersion: 1; dock: 'left' | 'right'; targetThreshold: 24 | 44; blur: number; }
export const defaultPreferences: Preferences = { schemaVersion: 1, dock: 'right', targetThreshold: 24, blur: 2 };
export const preferencesSchema: RuntimeSchema<Preferences> = { parse(value) {
  const v = object(value); exact(v, ['schemaVersion', 'dock', 'targetThreshold', 'blur']);
  if (v.schemaVersion !== 1 || !['left', 'right'].includes(String(v.dock)) || ![24, 44].includes(Number(v.targetThreshold)) || typeof v.targetThreshold !== 'number' || typeof v.blur !== 'number' || !Number.isFinite(v.blur) || v.blur < 0 || v.blur > 8) throw new Error('Invalid preferences');
  return v as unknown as Preferences;
} };
export interface Finding { id: string; ruleId: string; impact: Impact; description: string; help: string; helpUrl: string; tags: string[]; reviewStatus: 'violation' | 'needs-review'; target: string[]; elementType: string; explanation: string; suggestion: string; }
export interface TargetObservation { id: string; target: string; width: number; height: number; threshold: 24 | 44; small: boolean; }
export interface AuditReport {
  schemaVersion: 1; productVersion: string; engine: { name: string; version: string; tags: string[] }; page: string;
  viewport: { width: number; height: number }; startedAt: string; durationMs: number; generation: number; pageRevision: number; stale: boolean;
  scope: { topDocument: true; excludedFrames: number; limits: string[] }; violations: Finding[]; needsReview: Finding[];
}
function textField(value: unknown) { if (typeof value !== 'string') throw new Error('Invalid text'); }
function strings(value: unknown) { if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) throw new Error('Invalid text list'); }
function positive(value: unknown, integer=false) { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) throw new Error('Invalid number'); }
export const reportSchema: RuntimeSchema<AuditReport> = { parse(value) {
  if (new TextEncoder().encode(JSON.stringify(value)).length > REPORT_BYTES) throw new Error('Report exceeds 5 MiB; no partial report published or exported');
  const v = object(value); exact(v, ['schemaVersion','productVersion','engine','page','viewport','startedAt','durationMs','generation','pageRevision','stale','scope','violations','needsReview']);
  if (v.schemaVersion !== 1 || typeof v.stale !== 'boolean') throw new Error('Unsupported report');
  for (const key of ['productVersion','page','startedAt']) textField(v[key]);
  const engine=object(v.engine);exact(engine,['name','version','tags']);textField(engine.name);textField(engine.version);strings(engine.tags);
  const viewport=object(v.viewport);exact(viewport,['width','height']);positive(viewport.width);positive(viewport.height);
  for(const key of ['durationMs','generation','pageRevision']) positive(v[key],key!=='durationMs');
  const scope=object(v.scope);exact(scope,['topDocument','excludedFrames','limits']);if(scope.topDocument!==true)throw new Error('Unsupported scope');positive(scope.excludedFrames,true);strings(scope.limits);
  for (const key of ['violations','needsReview']) {
    if (!Array.isArray(v[key])) throw new Error('Invalid findings');
    for (const entry of v[key] as unknown[]) {
      const f=object(entry);exact(f,['id','ruleId','impact','description','help','helpUrl','tags','reviewStatus','target','elementType','explanation','suggestion']);
      for(const name of ['id','ruleId','description','help','helpUrl','elementType','explanation','suggestion'])textField(f[name]);
      strings(f.tags);strings(f.target);
      if (![null,'minor','moderate','serious','critical'].includes(f.impact as Impact) || f.reviewStatus!==(key==='violations'?'violation':'needs-review')) throw new Error('Invalid finding');
    }
  }
  return v as unknown as AuditReport;
} };
export interface FocusObservation { index:number; target:string; elementType:string; }
export type Cleanup = () => void | Promise<void>;
export interface EffectRegistry { add(cleanup: Cleanup): Cleanup; dispose(): Promise<void>; readonly size: number; }
export interface OverlayService { show(element: Element, label?: string): Cleanup; clear(): void; }
export interface BaselineEffect { suspend():void; resume():void; }
export type ModuleEvent = {type:'preview-error';message:string} | { type:'targets'; observations:TargetObservation[]; totalCandidates:number; truncated:number } | { type:'target-hover'; observation:TargetObservation } | { type: 'status'; message: string } | { type: 'focus'; visits: number; trail:FocusObservation[] };
export interface ModuleContext { document: Document; signal: AbortSignal; effects: EffectRegistry; overlay: OverlayService; report: (event: ModuleEvent) => void; baseline?:{register(effect:BaselineEffect):Cleanup}; own?:(node:Node)=>void; ownAttribute?:(element:Element,name:string)=>Cleanup; }
export interface AccessLabModule<Config = unknown> { id: string; apiVersion: 1; kind: 'audit' | 'inspection' | 'preview'; configSchema: RuntimeSchema<Config>; capabilities: readonly string[]; exclusiveGroup?: string; activate(ctx: ModuleContext, config: Config): Promise<Cleanup>; }
