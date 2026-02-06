import { XmlBuilder, type XmlAttrs } from '../xml-builder';
import type { DefineTableOp, ModifyTableOp, DropTableOp, AttrDef } from '../types';

export function generateAttrDef(xb: XmlBuilder, attr: AttrDef): void {
  const a: XmlAttrs = {
    attribute: attr.attribute,
    maxtype: attr.maxtype,
    length: attr.length,
    persistent: attr.persistent,
    haslongdesc: attr.haslongdesc,
    required: attr.required,
    userdefined: attr.userdefined,
    domain: attr.domain,
    classname: attr.classname,
    defaultvalue: attr.defaultvalue,
    title: attr.title,
    remarks: attr.remarks,
    sameasobject: attr.sameasobject,
    sameasattribute: attr.sameasattribute,
    mustbe: attr.mustbe,
    ispositive: attr.ispositive,
    scale: attr.scale,
    autokey: attr.autokey,
    canautonum: attr.canautonum,
    searchtype: attr.searchtype,
    localizable: attr.localizable,
    domainlink: attr.domainlink,
    restricted: attr.restricted,
  };
  xb.selfClosingTag('attrdef', a);
}

export function generateDefineTable(op: DefineTableOp): string {
  const xb = new XmlBuilder();
  xb.openTag('define_table', {
    object: op.object,
    description: op.description,
    service: op.service,
    classname: op.classname,
    persistent: op.persistent,
    type: op.tableType,
    primarykey: op.primarykey,
    mainobject: op.mainobject,
    internal: op.internal,
    trigroot: op.trigroot,
    storagetype: op.storagetype,
  });
  for (const attr of op.attributes) {
    generateAttrDef(xb, attr);
  }
  xb.closeTag('define_table');
  return xb.toString();
}

export function generateModifyTable(op: ModifyTableOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_table', {
    name: op.name,
    object: op.object,
    description: op.description,
    service: op.service,
    classname: op.classname,
    type: op.tableType,
    primarykey: op.primarykey,
    mainobject: op.mainobject,
    internal: op.internal,
    trigroot: op.trigroot,
    unique_column: op.unique_column,
    storagetype: op.storagetype,
  });
  return xb.toString();
}

export function generateDropTable(op: DropTableOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_table', { object: op.object });
  return xb.toString();
}
