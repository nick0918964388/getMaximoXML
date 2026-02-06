import { describe, it, expect } from 'vitest';
import { generateAddProperty, generateSetProperty, generateDropProperty } from './property';

describe('generateAddProperty', () => {
  it('should generate add_property with all fields', () => {
    const xml = generateAddProperty({
      type: 'add_property',
      name: 'myprop.setting',
      description: 'My property',
      maxtype: 'ALN',
      secure_level: 'public',
      scope: 'global',
      default_value: 'hello',
      live_refresh: true,
    });
    expect(xml).toContain('<add_property');
    expect(xml).toContain('name="myprop.setting"');
    expect(xml).toContain('maxtype="ALN"');
    expect(xml).toContain('secure_level="public"');
    expect(xml).toContain('scope="global"');
    expect(xml).toContain('default_value="hello"');
  });
});

describe('generateSetProperty', () => {
  it('should generate set_property', () => {
    const xml = generateSetProperty({
      type: 'set_property',
      name: 'myprop.setting',
      value: 'newval',
    });
    expect(xml).toContain('<set_property name="myprop.setting" value="newval" />');
  });
});

describe('generateDropProperty', () => {
  it('should generate drop_property', () => {
    const xml = generateDropProperty({ type: 'drop_property', name: 'myprop.setting' });
    expect(xml).toContain('<drop_property name="myprop.setting" />');
  });
});
