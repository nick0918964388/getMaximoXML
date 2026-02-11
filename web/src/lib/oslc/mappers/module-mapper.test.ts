import { describe, it, expect } from 'vitest';
import { mapModuleToDbcOp } from './module-mapper';
import type { OslcMaxModule } from '../types';

describe('mapModuleToDbcOp', () => {
  it('should map module to CreateModuleOp', () => {
    const mod: OslcMaxModule = {
      module: 'WORK_MGMT',
      description: 'Work Management',
    };

    const result = mapModuleToDbcOp(mod);
    expect(result.type).toBe('create_module');
    expect(result.module).toBe('WORK_MGMT');
    expect(result.description).toBe('Work Management');
    expect(result.items).toEqual([]);
  });

  it('should use empty string for missing description', () => {
    const mod: OslcMaxModule = {
      module: 'TESTMOD',
    };

    const result = mapModuleToDbcOp(mod);
    expect(result.description).toBe('');
  });
});
