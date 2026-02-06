import { XmlBuilder } from '../xml-builder';
import type { CreateRelationshipOp, ModifyRelationshipOp, DropRelationshipOp } from '../types';

export function generateCreateRelationship(op: CreateRelationshipOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('create_relationship', {
    parent: op.parent,
    name: op.name,
    child: op.child,
    whereclause: op.whereclause,
    remarks: op.remarks,
  });
  return xb.toString();
}

export function generateModifyRelationship(op: ModifyRelationshipOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_relationship', {
    parent: op.parent,
    name: op.name,
    child: op.child,
    whereclause: op.whereclause,
    remarks: op.remarks,
  });
  return xb.toString();
}

export function generateDropRelationship(op: DropRelationshipOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_relationship', {
    parent: op.parent,
    name: op.name,
  });
  return xb.toString();
}
