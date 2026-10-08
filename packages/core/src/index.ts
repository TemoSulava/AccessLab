import type { AccessLabModule, Cleanup, EffectRegistry, ModuleContext } from '@accesslab/contracts';
export class Effects implements EffectRegistry {
  private entries: Cleanup[] = [];
  private disposed = false;
  private late: Promise<unknown>[] = [];
  get size() { return this.entries.length; }
  add(cleanup: Cleanup): Cleanup {
    let used = false;
    const once: Cleanup = async () => { if (used) return; used = true; this.entries = this.entries.filter(x => x !== once); await cleanup(); };
    if (this.disposed) this.late.push(Promise.resolve().then(once));
    else this.entries.push(once);
    return once;
  }
  async dispose() {
    this.disposed = true;
    const errors: unknown[] = [];
    for (const entry of [...this.entries].reverse()) { try { await entry(); } catch (e) { errors.push(e); } }
    const late = await Promise.allSettled(this.late.splice(0));
    for (const result of late) if (result.status === 'rejected') errors.push(result.reason);
    if (errors.length) throw new AggregateError(errors, 'Some AccessLab effects failed to clean up');
  }
}
export class Generation {
  private value = 0;
  next() { return ++this.value; }
  invalidate() { return ++this.value; }
  current(id: number) { return this.value === id; }
  get id() { return this.value; }
}
interface Instance { abort: AbortController; effects: Effects; group?: string; }
export class ModuleManager {
  private registry = new Map<string, AccessLabModule>();
  private instances = new Map<string, Instance>();
  private intents = new Map<string, number>();
  private serial = 0;
  constructor(private base: Omit<ModuleContext, 'signal' | 'effects'>) {}
  register<C>(module: AccessLabModule<C>) {
    if (module.apiVersion !== 1 || this.registry.has(module.id)) throw new Error('Duplicate or unsupported module');
    this.registry.set(module.id, module as AccessLabModule);
  }
  get activeIds() { return [...this.instances.keys()]; }
  async activate(id: string, config: unknown): Promise<void> {
    const module = this.registry.get(id); if (!module) throw new Error('Unknown module');
    const parsed = module.configSchema.parse(config);
    const intent = ++this.serial; this.intents.set(id, intent);
    await this.disposeInstance(id);
    if (this.intents.get(id) !== intent) return;
    if (module.exclusiveGroup) for (const [other, instance] of this.instances) if (instance.group === module.exclusiveGroup) await this.deactivate(other);
    if (this.intents.get(id) !== intent) return;
    const instance: Instance = { abort: new AbortController(), effects: new Effects(), group: module.exclusiveGroup };
    this.instances.set(id, instance);
    try {
      const cleanup = await module.activate({ ...this.base, signal: instance.abort.signal, effects: instance.effects }, parsed);
      if (instance.abort.signal.aborted || this.instances.get(id) !== instance) { await cleanup(); await instance.effects.dispose(); return; }
      instance.effects.add(cleanup);
    } catch (error) {
      if (this.instances.get(id) === instance) this.instances.delete(id);
      instance.abort.abort();
      try { await instance.effects.dispose(); } catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Activation rollback failed'); }
      throw error;
    }
  }
  private async disposeInstance(id: string) {
    const instance = this.instances.get(id); if (!instance) return;
    this.instances.delete(id); instance.abort.abort(); await instance.effects.dispose();
  }
  async deactivate(id: string) { this.intents.set(id, ++this.serial); await this.disposeInstance(id); }
  async reset() {
    for (const id of this.intents.keys()) this.intents.set(id, ++this.serial);
    const instances = [...this.instances.values()]; this.instances.clear();
    for (const instance of instances) instance.abort.abort();
    const results = await Promise.allSettled(instances.reverse().map(instance => instance.effects.dispose()));
    const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);
    if (errors.length) throw new AggregateError(errors, 'Module cleanup errors');
  }
}
export { OverlayLayer } from './overlay';
