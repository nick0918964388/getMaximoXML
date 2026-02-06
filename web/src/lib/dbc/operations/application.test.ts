import { describe, it, expect } from 'vitest';
import {
  generateCreateApp, generateModifyApp, generateDropApp,
  generateCreateAppMenu, generateAdditionalAppMenu,
  generateAddSigOption, generateDropSigOption,
} from './application';

describe('generateCreateApp', () => {
  it('should generate create_app', () => {
    const xml = generateCreateApp({
      type: 'create_app',
      app: 'MYAPP',
      description: 'My Application',
      maintbname: 'MYTABLE',
    });
    expect(xml).toContain('<create_app');
    expect(xml).toContain('app="MYAPP"');
    expect(xml).toContain('description="My Application"');
    expect(xml).toContain('maintbname="MYTABLE"');
  });
});

describe('generateModifyApp', () => {
  it('should generate modify_app', () => {
    const xml = generateModifyApp({
      type: 'modify_app',
      app: 'MYAPP',
      description: 'Updated desc',
    });
    expect(xml).toContain('<modify_app');
    expect(xml).toContain('app="MYAPP"');
    expect(xml).toContain('description="Updated desc"');
  });
});

describe('generateDropApp', () => {
  it('should generate drop_app', () => {
    const xml = generateDropApp({ type: 'drop_app', app: 'MYAPP' });
    expect(xml).toContain('<drop_app app="MYAPP" />');
  });
});

describe('generateCreateAppMenu', () => {
  it('should generate create_app_menu with options and separators', () => {
    const xml = generateCreateAppMenu({
      type: 'create_app_menu',
      app: 'MYAPP',
      menuType: 'action',
      items: [
        { type: 'option', option: 'READ', tabdisplay: 'ALL' },
        { type: 'separator' },
        { type: 'option', option: 'SAVE', tabdisplay: 'MAIN', image: 'save.gif' },
      ],
    });
    expect(xml).toContain('<create_app_menu');
    expect(xml).toContain('app="MYAPP"');
    expect(xml).toContain('type="action"');
    expect(xml).toContain('<app_menu_option option="READ"');
    expect(xml).toContain('<menu_separator />');
    expect(xml).toContain('</create_app_menu>');
  });

  it('should generate create_app_menu with headers', () => {
    const xml = generateCreateAppMenu({
      type: 'create_app_menu',
      app: 'MYAPP',
      items: [
        {
          type: 'header',
          headerdescription: 'Actions',
          items: [
            { type: 'option', option: 'ACT1', tabdisplay: 'ALL' },
          ],
        },
      ],
    });
    expect(xml).toContain('<app_menu_header headerdescription="Actions"');
    expect(xml).toContain('<app_menu_option option="ACT1"');
    expect(xml).toContain('</app_menu_header>');
  });
});

describe('generateAdditionalAppMenu', () => {
  it('should generate additional_app_menu', () => {
    const xml = generateAdditionalAppMenu({
      type: 'additional_app_menu',
      app: 'MYAPP',
      menuType: 'tool',
      menu_position: 'before',
      pos_param: 'SAVE',
      items: [
        { type: 'option', option: 'NEWTOOL', tabdisplay: 'ALL' },
      ],
    });
    expect(xml).toContain('<additional_app_menu');
    expect(xml).toContain('type="tool"');
    expect(xml).toContain('menu_position="before"');
    expect(xml).toContain('pos_param="SAVE"');
  });
});

describe('generateAddSigOption', () => {
  it('should generate add_sigoption', () => {
    const xml = generateAddSigOption({
      type: 'add_sigoption',
      app: 'MYAPP',
      optionname: 'CUSTOMOPT',
      description: 'Custom option',
      granteveryone: true,
    });
    expect(xml).toContain('<add_sigoption');
    expect(xml).toContain('app="MYAPP"');
    expect(xml).toContain('optionname="CUSTOMOPT"');
    expect(xml).toContain('granteveryone="true"');
    expect(xml).toContain('/>');
  });
});

describe('generateDropSigOption', () => {
  it('should generate drop_sigoption', () => {
    const xml = generateDropSigOption({
      type: 'drop_sigoption',
      app: 'MYAPP',
      optionname: 'CUSTOMOPT',
    });
    expect(xml).toContain('<drop_sigoption app="MYAPP" optionname="CUSTOMOPT" />');
  });
});
