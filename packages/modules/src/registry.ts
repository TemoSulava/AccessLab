import type { AccessLabModule } from '@accesslab/contracts';
import { targetSize } from './target-size';
import { focusTrail } from './focus-trail';
import { visualPreview } from './visual-preview';
export interface ModuleEntry { module:AccessLabModule; control?:{label:string;description:string;defaultConfig:unknown}; }
// Compile-time imports only. Additional local controls are explicit opt-in.
export const moduleRegistry:readonly ModuleEntry[]=[
 {module:targetSize}, {module:focusTrail}, {module:visualPreview},
];
