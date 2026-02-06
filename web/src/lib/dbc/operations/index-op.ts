import { XmlBuilder } from '../xml-builder';
import type { SpecifyIndexOp, DropIndexOp, IndexKey } from '../types';

function writeIndexKeys(xb: XmlBuilder, keys: IndexKey[]): void {
  for (const k of keys) {
    xb.selfClosingTag('indexkey', { column: k.column, ascending: k.ascending });
  }
}

export function generateSpecifyIndex(op: SpecifyIndexOp): string {
  const xb = new XmlBuilder();
  xb.openTag('specify_index', {
    name: op.name,
    object: op.object,
    primary: op.primary,
    unique: op.unique,
    clustered: op.clustered,
    required: op.required,
    addtenantid: op.addtenantid,
  });
  writeIndexKeys(xb, op.keys);
  xb.closeTag('specify_index');
  return xb.toString();
}

export function generateDropIndex(op: DropIndexOp): string {
  const xb = new XmlBuilder();
  if (op.keys && op.keys.length > 0) {
    xb.openTag('drop_index', { name: op.name, object: op.object });
    writeIndexKeys(xb, op.keys);
    xb.closeTag('drop_index');
  } else {
    xb.selfClosingTag('drop_index', { name: op.name, object: op.object });
  }
  return xb.toString();
}
