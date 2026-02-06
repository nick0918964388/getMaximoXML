import { XmlBuilder } from '../xml-builder';
import type { CreateMaxvarOp, ModifyMaxvarOp, DropMaxvarOp } from '../types';

export function generateCreateMaxvar(op: CreateMaxvarOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('create_maxvar', {
    name: op.name,
    description: op.description,
    default: op.default,
    type: op.maxvarType,
  });
  return xb.toString();
}

export function generateModifyMaxvar(op: ModifyMaxvarOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_maxvar', {
    name: op.name,
    description: op.description,
    default: op.default,
    type: op.maxvarType,
  });
  return xb.toString();
}

export function generateDropMaxvar(op: DropMaxvarOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_maxvar', { name: op.name });
  return xb.toString();
}
