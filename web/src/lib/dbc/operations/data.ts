import { XmlBuilder } from '../xml-builder';
import type { InsertOp, FreeformOp } from '../types';

export function generateInsert(op: InsertOp): string {
  const xb = new XmlBuilder();
  xb.openTag('insert', {
    table: op.table,
    selectfrom: op.selectfrom,
    selectwhere: op.selectwhere,
    ignore_duplicates: op.ignore_duplicates,
  });
  for (const row of op.rows) {
    xb.openTag('insertrow');
    for (const col of row.columns) {
      xb.selfClosingTag('columnvalue', {
        column: col.column,
        string: col.string,
        fromcolumn: col.fromcolumn,
        boolean: col.boolean,
        number: col.number,
      });
    }
    xb.closeTag('insertrow');
  }
  xb.closeTag('insert');
  return xb.toString();
}

export function generateFreeform(op: FreeformOp): string {
  const xb = new XmlBuilder();
  xb.openTag('freeform', { description: op.description });
  for (const stmt of op.statements) {
    xb.textElement('sql', stmt.sql, { target: stmt.target ?? 'all' });
  }
  xb.closeTag('freeform');
  return xb.toString();
}
