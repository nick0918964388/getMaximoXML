import { describe, it, expect } from 'vitest';
import { generateCreateMaxvar, generateModifyMaxvar, generateDropMaxvar } from './maxvar';

describe('generateCreateMaxvar', () => {
  it('should generate create_maxvar', () => {
    const xml = generateCreateMaxvar({
      type: 'create_maxvar',
      name: 'MYVAR',
      description: 'My maxvar',
      default: 'defaultval',
      maxvarType: 'system',
    });
    expect(xml).toContain('<create_maxvar');
    expect(xml).toContain('name="MYVAR"');
    expect(xml).toContain('description="My maxvar"');
    expect(xml).toContain('default="defaultval"');
    expect(xml).toContain('type="system"');
  });
});

describe('generateModifyMaxvar', () => {
  it('should generate modify_maxvar', () => {
    const xml = generateModifyMaxvar({
      type: 'modify_maxvar',
      name: 'MYVAR',
      default: 'newval',
    });
    expect(xml).toContain('<modify_maxvar');
    expect(xml).toContain('name="MYVAR"');
    expect(xml).toContain('default="newval"');
  });
});

describe('generateDropMaxvar', () => {
  it('should generate drop_maxvar', () => {
    const xml = generateDropMaxvar({ type: 'drop_maxvar', name: 'MYVAR' });
    expect(xml).toContain('<drop_maxvar name="MYVAR" />');
  });
});
