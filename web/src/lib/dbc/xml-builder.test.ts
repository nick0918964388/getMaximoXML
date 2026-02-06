import { describe, it, expect } from 'vitest';
import { XmlBuilder } from './xml-builder';

describe('XmlBuilder', () => {
  describe('escapeXml', () => {
    it('should escape ampersand', () => {
      const xb = new XmlBuilder();
      xb.openTag('test', { value: 'a & b' });
      xb.closeTag('test');
      expect(xb.toString()).toContain('value="a &amp; b"');
    });

    it('should escape less-than and greater-than', () => {
      const xb = new XmlBuilder();
      xb.openTag('test', { value: 'a < b > c' });
      xb.closeTag('test');
      expect(xb.toString()).toContain('value="a &lt; b &gt; c"');
    });

    it('should escape double quotes', () => {
      const xb = new XmlBuilder();
      xb.openTag('test', { value: 'say "hello"' });
      xb.closeTag('test');
      expect(xb.toString()).toContain('value="say &quot;hello&quot;"');
    });

    it('should escape single quotes', () => {
      const xb = new XmlBuilder();
      xb.openTag('test', { value: "it's" });
      xb.closeTag('test');
      expect(xb.toString()).toContain("value=\"it&apos;s\"");
    });
  });

  describe('selfClosingTag', () => {
    it('should produce a self-closing tag with attributes', () => {
      const xb = new XmlBuilder();
      xb.selfClosingTag('drop_table', { object: 'MYTABLE' });
      expect(xb.toString()).toBe('<drop_table object="MYTABLE" />\n');
    });

    it('should skip undefined/null attributes', () => {
      const xb = new XmlBuilder();
      xb.selfClosingTag('test', { a: 'val', b: undefined, c: 'other' });
      const output = xb.toString();
      expect(output).toContain('a="val"');
      expect(output).not.toContain('b=');
      expect(output).toContain('c="other"');
    });

    it('should handle boolean attributes', () => {
      const xb = new XmlBuilder();
      xb.selfClosingTag('test', { required: true, persistent: false });
      const output = xb.toString();
      expect(output).toContain('required="true"');
      expect(output).toContain('persistent="false"');
    });

    it('should handle numeric attributes', () => {
      const xb = new XmlBuilder();
      xb.selfClosingTag('test', { length: 100, scale: 0 });
      const output = xb.toString();
      expect(output).toContain('length="100"');
      expect(output).toContain('scale="0"');
    });
  });

  describe('openTag / closeTag', () => {
    it('should indent child elements', () => {
      const xb = new XmlBuilder();
      xb.openTag('parent', { name: 'P' });
      xb.selfClosingTag('child', { id: '1' });
      xb.closeTag('parent');
      const lines = xb.toString().split('\n').filter(Boolean);
      expect(lines[0]).toBe('<parent name="P">');
      expect(lines[1]).toBe('  <child id="1" />');
      expect(lines[2]).toBe('</parent>');
    });

    it('should handle nested indentation', () => {
      const xb = new XmlBuilder();
      xb.openTag('a');
      xb.openTag('b');
      xb.selfClosingTag('c');
      xb.closeTag('b');
      xb.closeTag('a');
      const lines = xb.toString().split('\n').filter(Boolean);
      expect(lines[0]).toBe('<a>');
      expect(lines[1]).toBe('  <b>');
      expect(lines[2]).toBe('    <c />');
      expect(lines[3]).toBe('  </b>');
      expect(lines[4]).toBe('</a>');
    });
  });

  describe('textElement', () => {
    it('should produce an element with text content', () => {
      const xb = new XmlBuilder();
      xb.textElement('description', 'Hello World');
      expect(xb.toString()).toBe('<description>Hello World</description>\n');
    });

    it('should escape text content', () => {
      const xb = new XmlBuilder();
      xb.textElement('sql', 'SELECT * FROM t WHERE x < 5 & y > 3');
      expect(xb.toString()).toContain('x &lt; 5 &amp; y &gt; 3');
    });

    it('should produce element with attributes and text', () => {
      const xb = new XmlBuilder();
      xb.textElement('sql', 'SELECT 1', { target: 'all' });
      expect(xb.toString()).toBe('<sql target="all">SELECT 1</sql>\n');
    });
  });

  describe('cdata', () => {
    it('should wrap content in CDATA section', () => {
      const xb = new XmlBuilder();
      xb.openTag('sql');
      xb.cdata('SELECT * FROM t WHERE x < 5');
      xb.closeTag('sql');
      expect(xb.toString()).toContain('<![CDATA[SELECT * FROM t WHERE x < 5]]>');
    });
  });

  describe('rawLine', () => {
    it('should output raw content at current indentation', () => {
      const xb = new XmlBuilder();
      xb.openTag('parent');
      xb.rawLine('<!-- comment -->');
      xb.closeTag('parent');
      const lines = xb.toString().split('\n').filter(Boolean);
      expect(lines[1]).toBe('  <!-- comment -->');
    });
  });

  describe('xmlDeclaration', () => {
    it('should output xml declaration', () => {
      const xb = new XmlBuilder();
      xb.xmlDeclaration();
      expect(xb.toString()).toBe('<?xml version="1.0" encoding="UTF-8"?>\n');
    });
  });

  describe('complex document', () => {
    it('should produce a valid DBC-like structure', () => {
      const xb = new XmlBuilder();
      xb.xmlDeclaration();
      xb.openTag('script', { author: 'TEST', scriptname: 'V1000_01' });
      xb.textElement('description', 'Test script');
      xb.openTag('statements');
      xb.selfClosingTag('drop_table', { object: 'MYTABLE' });
      xb.closeTag('statements');
      xb.closeTag('script');

      const output = xb.toString();
      expect(output).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(output).toContain('<script author="TEST" scriptname="V1000_01">');
      expect(output).toContain('  <description>Test script</description>');
      expect(output).toContain('  <statements>');
      expect(output).toContain('    <drop_table object="MYTABLE" />');
      expect(output).toContain('  </statements>');
      expect(output).toContain('</script>');
    });
  });
});
