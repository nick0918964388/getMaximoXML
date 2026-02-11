import { describe, it, expect } from 'vitest';
import { mapAppToDbcOp } from './app-mapper';
import type { OslcMaxApp } from '../types';

describe('mapAppToDbcOp', () => {
  it('should map app to CreateAppOp', () => {
    const app: OslcMaxApp = {
      app: 'WOTRACK',
      description: 'Work Order Tracking',
      maintbname: 'WORKORDER',
    };

    const result = mapAppToDbcOp(app);
    expect(result.type).toBe('create_app');
    expect(result.app).toBe('WOTRACK');
    expect(result.description).toBe('Work Order Tracking');
    expect(result.maintbname).toBe('WORKORDER');
  });

  it('should use empty string for missing description', () => {
    const app: OslcMaxApp = {
      app: 'TESTAPP',
    };

    const result = mapAppToDbcOp(app);
    expect(result.description).toBe('');
  });

  it('should map restrictions and orderby', () => {
    const app: OslcMaxApp = {
      app: 'MYAPP',
      description: 'My App',
      restrictions: 'NOLOOKUP',
      orderby: 'WONUM DESC',
    };

    const result = mapAppToDbcOp(app);
    expect(result.restrictions).toBe('NOLOOKUP');
    expect(result.orderby).toBe('WONUM DESC');
  });
});
