import { describe, it, expect } from 'vitest';
import { generateApplication, generatePresentation } from './application';
import type { ApplicationDefinition, ApplicationMetadata, ProcessedField, TabDefinition } from '../types';

describe('application assembler', () => {
  describe('generatePresentation', () => {
    it('should generate complete presentation XML', () => {
      const listFields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'status',
          dataattribute: 'status',
          label: '狀態',
          type: 'tablecol',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '45',
          filterable: true,
          sortable: true,
          area: 'list',
          tabName: '',
          tableName: '',
        },
      ];

      const headerFields: ProcessedField[] = [
        {
          id: '2',
          fieldName: 'ZZ_EQ24',
          dataattribute: 'ZZ_EQ24',
          label: '車號',
          type: 'textbox',
          inputMode: 'required',
          lookup: 'ASSET',
          relationship: '',
          applink: 'ZZ_ASSET',
          width: '12',
          filterable: false,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
        },
      ];

      const tabs = new Map<string, TabDefinition>();
      tabs.set('main', {
        id: 'main',
        label: '進廠動態管理',
        headerFields,
        detailTables: new Map(),
      });

      const appDef: ApplicationDefinition = {
        listFields,
        tabs,
      };

      const metadata: ApplicationMetadata = {
        id: 'zz_acceptfactory',
        keyAttribute: 'zz_imnum',
        mboName: 'SR',
        version: '7.1.0.0',
        orderBy: 'TICKETID desc',
        whereClause: 'historyflag = 0',
      };

      const result = generatePresentation(appDef, metadata);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<presentation');
      expect(result).toContain('id="zz_acceptfactory"');
      expect(result).toContain('keyattribute="zz_imnum"');
      expect(result).toContain('mboname="SR"');
      expect(result).toContain('version="7.1.0.0"');
      expect(result).toContain('<page id="mainrec">');
      expect(result).toContain('<tab default="true" id="results"');
      expect(result).toContain('<tab id="main"');
      expect(result).toContain('</presentation>');
    });

    it('should include clientarea and tabgroup', () => {
      const tabs = new Map<string, TabDefinition>();
      const appDef: ApplicationDefinition = {
        listFields: [],
        tabs,
      };

      const metadata: ApplicationMetadata = {
        id: 'test_app',
        keyAttribute: 'ticketid',
        mboName: 'SR',
        version: '7.1.0.0',
        orderBy: 'TICKETID desc',
        whereClause: '',
      };

      const result = generatePresentation(appDef, metadata);

      expect(result).toContain('<clientarea id="clientarea">');
      expect(result).toContain('<tabgroup id="maintabs"');
      expect(result).toContain('</tabgroup>');
      expect(result).toContain('</clientarea>');
    });

    it('should include page header and footer includes', () => {
      const appDef: ApplicationDefinition = {
        listFields: [],
        tabs: new Map(),
      };

      const metadata: ApplicationMetadata = {
        id: 'test_app',
        keyAttribute: 'ticketid',
        mboName: 'SR',
        version: '7.1.0.0',
        orderBy: '',
        whereClause: '',
      };

      const result = generatePresentation(appDef, metadata);

      expect(result).toContain('<include controltoclone="pageHeader"');
      expect(result).toContain('<include controltoclone="pageFooter"');
    });
  });

  describe('generateApplication', () => {
    it('should generate application with dialogs', () => {
      const headerFields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'ZZ_EQ24',
          dataattribute: 'ZZ_EQ24',
          label: '車號',
          type: 'textbox',
          inputMode: 'required',
          lookup: '',
          relationship: '',
          applink: '',
          width: '12',
          filterable: true,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
        },
      ];

      const tabs = new Map<string, TabDefinition>();
      tabs.set('main', {
        id: 'main',
        label: 'Main',
        headerFields,
        detailTables: new Map(),
      });

      const appDef: ApplicationDefinition = {
        listFields: [],
        tabs,
      };

      const metadata: ApplicationMetadata = {
        id: 'test_app',
        keyAttribute: 'ticketid',
        mboName: 'SR',
        version: '7.1.0.0',
        orderBy: '',
        whereClause: '',
      };

      const result = generateApplication(appDef, metadata);

      expect(result).toContain('<dialog id="searchmore"');
      expect(result).toContain('</dialog>');
    });
  });
});
