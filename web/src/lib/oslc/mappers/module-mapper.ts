import type { CreateModuleOp } from '@/lib/dbc/types';
import type { OslcMaxModule } from '../types';

/**
 * Map an OSLC module to a CreateModuleOp
 */
export function mapModuleToDbcOp(mod: OslcMaxModule): CreateModuleOp {
  return {
    type: 'create_module',
    module: mod.module,
    description: mod.description ?? '',
    items: [],
  };
}
