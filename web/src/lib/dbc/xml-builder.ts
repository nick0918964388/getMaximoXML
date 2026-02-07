export type XmlAttrs = Record<string, string | number | boolean | undefined | null>;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatAttrs(attrs?: XmlAttrs): string {
  if (!attrs) return '';
  const parts: string[] = [];
  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null) continue;
    parts.push(`${key}="${escapeXml(String(val))}"`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

export class XmlBuilder {
  private lines: string[] = [];
  private depth = 0;
  private indent = '  ';

  private prefix(): string {
    return this.indent.repeat(this.depth);
  }

  xmlDeclaration(): void {
    this.lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  doctype(rootElement: string, dtdFile: string): void {
    this.lines.push(`<!DOCTYPE ${rootElement} SYSTEM "${dtdFile}">`);
  }

  openTag(name: string, attrs?: XmlAttrs): void {
    this.lines.push(`${this.prefix()}<${name}${formatAttrs(attrs)}>`);
    this.depth++;
  }

  closeTag(name: string): void {
    this.depth--;
    this.lines.push(`${this.prefix()}</${name}>`);
  }

  selfClosingTag(name: string, attrs?: XmlAttrs): void {
    this.lines.push(`${this.prefix()}<${name}${formatAttrs(attrs)} />`);
  }

  textElement(name: string, text: string, attrs?: XmlAttrs): void {
    this.lines.push(`${this.prefix()}<${name}${formatAttrs(attrs)}>${escapeXml(text)}</${name}>`);
  }

  cdata(content: string): void {
    this.lines.push(`${this.prefix()}<![CDATA[${content}]]>`);
  }

  rawLine(content: string): void {
    this.lines.push(`${this.prefix()}${content}`);
  }

  toString(): string {
    return this.lines.join('\n') + '\n';
  }
}
