import { describe, it, expect } from 'vitest';
import { generateAddService, generateModifyService, generateDropService } from './service';

describe('generateAddService', () => {
  it('should generate add_service', () => {
    const xml = generateAddService({
      type: 'add_service',
      servicename: 'MYSVC',
      description: 'My Service',
      classname: 'com.example.MySvc',
      singleton: true,
    });
    expect(xml).toContain('<add_service');
    expect(xml).toContain('servicename="MYSVC"');
    expect(xml).toContain('classname="com.example.MySvc"');
    expect(xml).toContain('singleton="true"');
  });
});

describe('generateModifyService', () => {
  it('should generate modify_service', () => {
    const xml = generateModifyService({
      type: 'modify_service',
      servicename: 'MYSVC',
      description: 'Updated',
    });
    expect(xml).toContain('<modify_service');
    expect(xml).toContain('servicename="MYSVC"');
    expect(xml).toContain('description="Updated"');
  });
});

describe('generateDropService', () => {
  it('should generate drop_service', () => {
    const xml = generateDropService({ type: 'drop_service', servicename: 'MYSVC' });
    expect(xml).toContain('<drop_service servicename="MYSVC" />');
  });
});
