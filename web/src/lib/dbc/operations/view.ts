import { XmlBuilder } from '../xml-builder';
import type {
  DefineViewOp, ModifyViewOp, DropViewOp,
  AddViewAttributeOp, DropViewAttributeOp, ModifyViewAttributesOp,
} from '../types';

export function generateDefineView(op: DefineViewOp): string {
  const xb = new XmlBuilder();
  xb.openTag('define_view', {
    name: op.name,
    description: op.description,
    service: op.service,
    classname: op.classname,
    extends: op.extends,
    type: op.viewType,
    mainobject: op.mainobject,
    internal: op.internal,
  });

  if (op.mode === 'autoselect') {
    xb.selfClosingTag('autoselect');
    if (op.tables) {
      for (const t of op.tables) {
        xb.selfClosingTag('table', { name: t.name });
      }
    }
    if (op.columns) {
      for (const c of op.columns) {
        xb.selfClosingTag('view_column', {
          table: c.table, column: c.column,
          view_column: c.view_column, same_storage_as: c.same_storage_as,
        });
      }
    }
  } else {
    if (op.columns) {
      for (const c of op.columns) {
        xb.selfClosingTag('view_column', {
          table: c.table, column: c.column,
          view_column: c.view_column, same_storage_as: c.same_storage_as,
        });
      }
    }
    if (op.view_select) xb.textElement('view_select', op.view_select);
    if (op.view_from) xb.textElement('view_from', op.view_from);
  }

  xb.textElement('view_where', op.view_where);
  xb.closeTag('define_view');
  return xb.toString();
}

export function generateModifyView(op: ModifyViewOp): string {
  const xb = new XmlBuilder();
  const hasChildren = op.view_select || op.view_from || op.view_where;
  if (hasChildren) {
    xb.openTag('modify_view', {
      name: op.name,
      classname: op.classname,
      description: op.description,
      mainobject: op.mainobject,
      internal: op.internal,
      service: op.service,
      type: op.viewType,
    });
    if (op.view_select) xb.textElement('view_select', op.view_select);
    if (op.view_from) xb.textElement('view_from', op.view_from);
    if (op.view_where) xb.textElement('view_where', op.view_where);
    xb.closeTag('modify_view');
  } else {
    xb.selfClosingTag('modify_view', {
      name: op.name,
      classname: op.classname,
      description: op.description,
      mainobject: op.mainobject,
      internal: op.internal,
      service: op.service,
      type: op.viewType,
    });
  }
  return xb.toString();
}

export function generateDropView(op: DropViewOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_view', { name: op.name });
  return xb.toString();
}

export function generateAddViewAttribute(op: AddViewAttributeOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('add_view_attribute', {
    view: op.view,
    view_column: op.view_column,
    table: op.table,
    column: op.column,
    same_storage_as: op.same_storage_as,
  });
  return xb.toString();
}

export function generateDropViewAttribute(op: DropViewAttributeOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_view_attribute', {
    view: op.view,
    attribute: op.attribute,
  });
  return xb.toString();
}

export function generateModifyViewAttributes(op: ModifyViewAttributesOp): string {
  const xb = new XmlBuilder();
  xb.openTag('modify_view_attributes', { view: op.view });
  for (const m of op.modifications) {
    xb.selfClosingTag('modify_view_data', {
      view_column: m.view_column,
      new_name: m.new_name,
      table: m.table,
      column: m.column,
      same_storage_as: m.same_storage_as,
    });
  }
  xb.closeTag('modify_view_attributes');
  return xb.toString();
}
