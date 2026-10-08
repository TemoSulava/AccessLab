import { it, expect } from 'vitest';import { smallTarget } from '../../packages/modules/src/target-size';
it('checks both dimensions at 23/24/25 and 43/44/45 boundaries',()=>{for(const t of [24,44] as const){expect(smallTarget(t-1,t,t)).toBe(true);expect(smallTarget(t,t-1,t)).toBe(true);expect(smallTarget(t,t,t)).toBe(false);expect(smallTarget(t+1,t+1,t)).toBe(false);}});
