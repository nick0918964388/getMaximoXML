import { XmlBuilder } from './xml-builder';
import { generateCheck } from './operations/check';
import { generateOperation } from './operations';
import type { DbcBuilderState } from './types';

export function buildDbcScript(state: DbcBuilderState): string {
  const xb = new XmlBuilder();
  xb.xmlDeclaration();

  const scriptAttrs: Record<string, string | boolean | undefined> = {
    author: state.script.author,
    scriptname: state.script.scriptname,
  };
  if (state.script.for_demo_only !== undefined) scriptAttrs.for_demo_only = state.script.for_demo_only;
  if (state.script.context) scriptAttrs.context = state.script.context;
  if (state.script.tenantcode) scriptAttrs.tenantcode = state.script.tenantcode;

  xb.openTag('script', scriptAttrs);

  if (state.script.description) {
    xb.textElement('description', state.script.description);
  }

  for (const check of state.checks) {
    // Inline the check XML with proper indentation
    const checkXml = generateCheck(check);
    for (const line of checkXml.trimEnd().split('\n')) {
      xb.rawLine(line);
    }
  }

  xb.openTag('statements');

  for (const entry of state.operations) {
    const opXml = generateOperation(entry.operation);
    for (const line of opXml.trimEnd().split('\n')) {
      xb.rawLine(line);
    }
  }

  xb.closeTag('statements');
  xb.closeTag('script');

  return xb.toString();
}
