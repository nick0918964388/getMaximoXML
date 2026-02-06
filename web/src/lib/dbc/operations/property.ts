import { XmlBuilder } from '../xml-builder';
import type { AddPropertyOp, SetPropertyOp, DropPropertyOp } from '../types';

export function generateAddProperty(op: AddPropertyOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('add_property', {
    name: op.name,
    description: op.description,
    maxtype: op.maxtype,
    domainid: op.domainid,
    scope: op.scope,
    secure_level: op.secure_level,
    live_refresh: op.live_refresh,
    required: op.required,
    online_changes: op.online_changes,
    user_defined: op.user_defined,
    default_value: op.default_value,
    encrypted: op.encrypted,
    masked: op.masked,
    value: op.value,
    valuerules: op.valuerules,
    accesstype: op.accesstype,
  });
  return xb.toString();
}

export function generateSetProperty(op: SetPropertyOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('set_property', { name: op.name, value: op.value });
  return xb.toString();
}

export function generateDropProperty(op: DropPropertyOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_property', { name: op.name });
  return xb.toString();
}
