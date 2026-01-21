import { describe, it, expect } from 'vitest';
import { generateMaximoXml, SAParser } from './index';
import * as path from 'path';

describe('Integration tests', () => {
  describe('SAParser with template file', () => {
    it('should parse the SA template file', async () => {
      const templatePath = path.join(__dirname, 'templates', 'sa-template.xlsx');
      const parser = new SAParser();

      const appDef = await parser.parseFile(templatePath);

      // Check list fields
      expect(appDef.listFields.length).toBeGreaterThan(0);

      // Check tabs
      expect(appDef.tabs.size).toBeGreaterThan(0);
      expect(appDef.tabs.has('main')).toBe(true);
    });

    it('should correctly group fields by area and tab', async () => {
      const templatePath = path.join(__dirname, 'templates', 'sa-template.xlsx');
      const parser = new SAParser();

      const appDef = await parser.parseFile(templatePath);

      // List fields should have 3 fields
      expect(appDef.listFields.length).toBe(3);

      // Main tab should have header fields
      const mainTab = appDef.tabs.get('main');
      expect(mainTab).toBeDefined();
      expect(mainTab!.headerFields.length).toBeGreaterThan(0);

      // 開工車登錄 tab should have detail tables
      const startTab = appDef.tabs.get('開工車登錄');
      expect(startTab).toBeDefined();
      expect(startTab!.detailTables.size).toBe(1);
      expect(startTab!.detailTables.has('ZZ_JOB_NUMBER')).toBe(true);
    });
  });

  describe('generateMaximoXml', () => {
    it('should generate complete XML from template file', async () => {
      const templatePath = path.join(__dirname, 'templates', 'sa-template.xlsx');

      const xml = await generateMaximoXml(templatePath, {
        id: 'zz_acceptfactory',
        keyAttribute: 'zz_imnum',
        mboName: 'SR',
        version: '7.1.0.0',
        orderBy: 'TICKETID desc',
        whereClause: 'historyflag = 0',
      });

      // Check XML structure
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<presentation');
      expect(xml).toContain('id="zz_acceptfactory"');
      expect(xml).toContain('mboname="SR"');
      expect(xml).toContain('<tab default="true" id="results"');
      expect(xml).toContain('label="main"');
      expect(xml).toContain('<dialog id="searchmore"');
      expect(xml).toContain('</presentation>');
    });
  });
});
