import { describe, it, expect } from 'vitest';
import { generateCreateModule, generateModifyModule, generateDropModule, generateModuleApp } from './module';

describe('generateCreateModule', () => {
  it('should generate create_module with apps and headers', () => {
    const xml = generateCreateModule({
      type: 'create_module',
      module: 'MYMOD',
      description: 'My Module',
      menu_position: 'last',
      items: [
        { type: 'app', app: 'MYAPP1' },
        {
          type: 'header',
          headerdescription: 'Sub Header',
          apps: [{ type: 'app', app: 'MYAPP2', image: 'icon.gif' }],
        },
      ],
    });
    expect(xml).toContain('<create_module');
    expect(xml).toContain('module="MYMOD"');
    expect(xml).toContain('<module_menu_app app="MYAPP1" />');
    expect(xml).toContain('<module_menu_header headerdescription="Sub Header">');
    expect(xml).toContain('<module_menu_app app="MYAPP2"');
    expect(xml).toContain('</module_menu_header>');
    expect(xml).toContain('</create_module>');
  });
});

describe('generateModifyModule', () => {
  it('should generate modify_module', () => {
    const xml = generateModifyModule({
      type: 'modify_module',
      module: 'MYMOD',
      description: 'Updated',
    });
    expect(xml).toContain('<modify_module');
    expect(xml).toContain('module="MYMOD"');
    expect(xml).toContain('description="Updated"');
  });
});

describe('generateDropModule', () => {
  it('should generate drop_module', () => {
    const xml = generateDropModule({ type: 'drop_module', module: 'MYMOD' });
    expect(xml).toContain('<drop_module module="MYMOD" />');
  });
});

describe('generateModuleApp', () => {
  it('should generate module_app', () => {
    const xml = generateModuleApp({
      type: 'module_app',
      module: 'MYMOD',
      app: 'MYAPP',
      menu_position: 'before',
      menu_pos_param: 'OTHERAPP',
    });
    expect(xml).toContain('<module_app');
    expect(xml).toContain('module="MYMOD"');
    expect(xml).toContain('app="MYAPP"');
    expect(xml).toContain('menu_position="before"');
  });
});
