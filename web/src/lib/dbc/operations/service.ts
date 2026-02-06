import { XmlBuilder } from '../xml-builder';
import type { AddServiceOp, ModifyServiceOp, DropServiceOp } from '../types';

export function generateAddService(op: AddServiceOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('add_service', {
    servicename: op.servicename,
    description: op.description,
    classname: op.classname,
    singleton: op.singleton,
  });
  return xb.toString();
}

export function generateModifyService(op: ModifyServiceOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_service', {
    servicename: op.servicename,
    description: op.description,
    classname: op.classname,
    singleton: op.singleton,
  });
  return xb.toString();
}

export function generateDropService(op: DropServiceOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_service', { servicename: op.servicename });
  return xb.toString();
}
