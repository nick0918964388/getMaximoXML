import { XmlBuilder } from '../xml-builder';
import type { AddAttributesOp, ModifyAttributeOp, DropAttributesOp } from '../types';
import { generateAttrDef } from './table';

export function generateAddAttributes(op: AddAttributesOp): string {
  const xb = new XmlBuilder();
  xb.openTag('add_attributes', { object: op.object });
  for (const attr of op.attributes) {
    generateAttrDef(xb, attr);
  }
  xb.closeTag('add_attributes');
  return xb.toString();
}

export function generateModifyAttribute(op: ModifyAttributeOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_attribute', {
    object: op.object,
    attribute: op.attribute,
    maxtype: op.maxtype,
    length: op.length,
    persistent: op.persistent,
    haslongdesc: op.haslongdesc,
    required: op.required,
    userdefined: op.userdefined,
    domain: op.domain,
    classname: op.classname,
    defaultvalue: op.defaultvalue,
    title: op.title,
    remarks: op.remarks,
    sameasobject: op.sameasobject,
    sameasattribute: op.sameasattribute,
    mustbe: op.mustbe,
    ispositive: op.ispositive,
    scale: op.scale,
    autokey: op.autokey,
    canautonum: op.canautonum,
    searchtype: op.searchtype,
    localizable: op.localizable,
    domainlink: op.domainlink,
    restricted: op.restricted,
    excludetenants: op.excludetenants,
  });
  return xb.toString();
}

export function generateDropAttributes(op: DropAttributesOp): string {
  const xb = new XmlBuilder();
  xb.openTag('drop_attributes', { object: op.object });
  for (const attr of op.attributes) {
    xb.selfClosingTag('attrname', { name: attr.name });
  }
  xb.closeTag('drop_attributes');
  return xb.toString();
}
