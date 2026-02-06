import { XmlBuilder } from '../xml-builder';
import type { DbcCheck } from '../types';

export function generateCheck(check: DbcCheck): string {
  const xb = new XmlBuilder();
  const attrs: Record<string, string | boolean | undefined> = {};
  if (check.tag !== undefined) attrs.tag = check.tag;
  if (check.group !== undefined) attrs.group = check.group;
  if (check.key !== undefined) attrs.key = check.key;
  if (check.default !== undefined) attrs.default = check.default;
  if (check.skip_script !== undefined) attrs.skip_script = check.skip_script;

  xb.openTag('check', Object.keys(attrs).length > 0 ? attrs : undefined);
  for (const q of check.queries) {
    xb.selfClosingTag('check_query', { query: q.query });
  }
  xb.closeTag('check');
  return xb.toString();
}
