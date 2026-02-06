import { describe, it, expect } from 'vitest';
import {
  generateDefineView, generateModifyView, generateDropView,
  generateAddViewAttribute, generateDropViewAttribute, generateModifyViewAttributes,
} from './view';

describe('generateDefineView', () => {
  it('should generate define_view with autoselect mode', () => {
    const xml = generateDefineView({
      type: 'define_view',
      name: 'MYVIEW',
      description: 'My view',
      service: 'ASSET',
      classname: 'psdi.mbo.ViewSet',
      viewType: 'system',
      mode: 'autoselect',
      tables: [{ name: 'TABLE1' }, { name: 'TABLE2' }],
      columns: [{ table: 'TABLE1', column: 'COL1', view_column: 'VCOL1' }],
      view_where: 'TABLE1.ID = TABLE2.ID',
    });
    expect(xml).toContain('<define_view');
    expect(xml).toContain('name="MYVIEW"');
    expect(xml).toContain('type="system"');
    expect(xml).toContain('<autoselect />');
    expect(xml).toContain('<table name="TABLE1" />');
    expect(xml).toContain('<view_column');
    expect(xml).toContain('<view_where>');
    expect(xml).toContain('</define_view>');
  });

  it('should generate define_view with custom mode', () => {
    const xml = generateDefineView({
      type: 'define_view',
      name: 'MYVIEW2',
      description: 'Custom view',
      service: 'ASSET',
      classname: 'cls',
      viewType: 'site',
      mode: 'custom',
      columns: [{ table: 'T1', column: 'C1', view_column: 'VC1' }],
      view_select: 'T1.C1 AS VC1',
      view_from: 'TABLE1 T1',
      view_where: '1=1',
    });
    expect(xml).toContain('<view_select>');
    expect(xml).toContain('<view_from>');
    expect(xml).not.toContain('<autoselect');
  });
});

describe('generateModifyView', () => {
  it('should generate modify_view', () => {
    const xml = generateModifyView({
      type: 'modify_view',
      name: 'MYVIEW',
      description: 'Updated',
      view_where: 'new_condition',
    });
    expect(xml).toContain('<modify_view');
    expect(xml).toContain('name="MYVIEW"');
    expect(xml).toContain('<view_where>new_condition</view_where>');
    expect(xml).toContain('</modify_view>');
  });

  it('should generate self-closing if no child elements', () => {
    const xml = generateModifyView({
      type: 'modify_view',
      name: 'MYVIEW',
      description: 'New desc',
    });
    expect(xml).toContain('<modify_view');
    expect(xml).toContain('/>');
  });
});

describe('generateDropView', () => {
  it('should generate drop_view', () => {
    const xml = generateDropView({ type: 'drop_view', name: 'MYVIEW' });
    expect(xml).toContain('<drop_view name="MYVIEW" />');
  });
});

describe('generateAddViewAttribute', () => {
  it('should generate add_view_attribute', () => {
    const xml = generateAddViewAttribute({
      type: 'add_view_attribute',
      view: 'MYVIEW',
      view_column: 'VCOL',
      table: 'MYTABLE',
      column: 'COL',
    });
    expect(xml).toContain('<add_view_attribute');
    expect(xml).toContain('view="MYVIEW"');
    expect(xml).toContain('view_column="VCOL"');
  });
});

describe('generateDropViewAttribute', () => {
  it('should generate drop_view_attribute', () => {
    const xml = generateDropViewAttribute({
      type: 'drop_view_attribute',
      view: 'MYVIEW',
      attribute: 'VCOL',
    });
    expect(xml).toContain('<drop_view_attribute');
    expect(xml).toContain('view="MYVIEW"');
    expect(xml).toContain('attribute="VCOL"');
  });
});

describe('generateModifyViewAttributes', () => {
  it('should generate modify_view_attributes with modify_view_data', () => {
    const xml = generateModifyViewAttributes({
      type: 'modify_view_attributes',
      view: 'MYVIEW',
      modifications: [
        { view_column: 'VCOL1', new_name: 'VCOL_NEW', table: 'T1', column: 'C1' },
      ],
    });
    expect(xml).toContain('<modify_view_attributes view="MYVIEW">');
    expect(xml).toContain('<modify_view_data');
    expect(xml).toContain('view_column="VCOL1"');
    expect(xml).toContain('new_name="VCOL_NEW"');
    expect(xml).toContain('</modify_view_attributes>');
  });
});
