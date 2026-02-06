import { XmlBuilder } from '../xml-builder';
import type {
  CreateAppOp, ModifyAppOp, DropAppOp,
  CreateAppMenuOp, AdditionalAppMenuOp,
  AddSigOptionOp, DropSigOptionOp,
  AppMenuItem,
} from '../types';

function writeMenuItems(xb: XmlBuilder, items: AppMenuItem[]): void {
  for (const item of items) {
    switch (item.type) {
      case 'option':
        xb.selfClosingTag('app_menu_option', {
          option: item.option,
          image: item.image,
          accesskey: item.accesskey,
          tabdisplay: item.tabdisplay,
        });
        break;
      case 'separator':
        xb.selfClosingTag('menu_separator', { tabdisplay: item.tabdisplay });
        break;
      case 'header':
        xb.openTag('app_menu_header', {
          headerdescription: item.headerdescription,
          image: item.image,
          tabdisplay: item.tabdisplay,
        });
        writeMenuItems(xb, item.items);
        xb.closeTag('app_menu_header');
        break;
    }
  }
}

export function generateCreateApp(op: CreateAppOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('create_app', {
    app: op.app,
    description: op.description,
    restrictions: op.restrictions,
    orderby: op.orderby,
    maintbname: op.maintbname,
  });
  return xb.toString();
}

export function generateModifyApp(op: ModifyAppOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_app', {
    app: op.app,
    description: op.description,
    restrictions: op.restrictions,
    orderby: op.orderby,
    maintbname: op.maintbname,
  });
  return xb.toString();
}

export function generateDropApp(op: DropAppOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_app', { app: op.app });
  return xb.toString();
}

export function generateCreateAppMenu(op: CreateAppMenuOp): string {
  const xb = new XmlBuilder();
  xb.openTag('create_app_menu', { app: op.app, type: op.menuType });
  writeMenuItems(xb, op.items);
  xb.closeTag('create_app_menu');
  return xb.toString();
}

export function generateAdditionalAppMenu(op: AdditionalAppMenuOp): string {
  const xb = new XmlBuilder();
  xb.openTag('additional_app_menu', {
    app: op.app,
    type: op.menuType,
    menu_position: op.menu_position,
    pos_param: op.pos_param,
  });
  writeMenuItems(xb, op.items);
  xb.closeTag('additional_app_menu');
  return xb.toString();
}

export function generateAddSigOption(op: AddSigOptionOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('add_sigoption', {
    app: op.app,
    optionname: op.optionname,
    description: op.description,
    esigenabled: op.esigenabled,
    visible: op.visible,
    alsogrants: op.alsogrants,
    alsorevokes: op.alsorevokes,
    prerequisite: op.prerequisite,
    langcode: op.langcode,
    grantapp: op.grantapp,
    grantoption: op.grantoption,
    granteveryone: op.granteveryone,
    grantcondition: op.grantcondition,
  });
  return xb.toString();
}

export function generateDropSigOption(op: DropSigOptionOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_sigoption', {
    app: op.app,
    optionname: op.optionname,
  });
  return xb.toString();
}
