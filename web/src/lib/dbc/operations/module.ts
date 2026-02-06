import { XmlBuilder } from '../xml-builder';
import type { CreateModuleOp, ModifyModuleOp, DropModuleOp, ModuleAppOp, ModuleMenuItem } from '../types';

function writeModuleItems(xb: XmlBuilder, items: ModuleMenuItem[]): void {
  for (const item of items) {
    if (item.type === 'app') {
      xb.selfClosingTag('module_menu_app', { app: item.app, image: item.image });
    } else {
      xb.openTag('module_menu_header', { headerdescription: item.headerdescription });
      for (const app of item.apps) {
        xb.selfClosingTag('module_menu_app', { app: app.app, image: app.image });
      }
      xb.closeTag('module_menu_header');
    }
  }
}

export function generateCreateModule(op: CreateModuleOp): string {
  const xb = new XmlBuilder();
  xb.openTag('create_module', {
    module: op.module,
    description: op.description,
    menu_position: op.menu_position,
    menu_param: op.menu_param,
    image: op.image,
  });
  writeModuleItems(xb, op.items);
  xb.closeTag('create_module');
  return xb.toString();
}

export function generateModifyModule(op: ModifyModuleOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_module', {
    module: op.module,
    description: op.description,
    menu_position: op.menu_position,
    menu_pos_param: op.menu_pos_param,
    image: op.image,
  });
  return xb.toString();
}

export function generateDropModule(op: DropModuleOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_module', { module: op.module });
  return xb.toString();
}

export function generateModuleApp(op: ModuleAppOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('module_app', {
    module: op.module,
    app: op.app,
    menu_position: op.menu_position,
    menu_pos_param: op.menu_pos_param,
    image: op.image,
  });
  return xb.toString();
}
