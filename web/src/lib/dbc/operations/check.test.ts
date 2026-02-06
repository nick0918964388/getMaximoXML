import { describe, it, expect } from 'vitest';
import { generateCheck } from './check';
import type { DbcCheck } from '../types';

describe('generateCheck', () => {
  it('should generate check with single query', () => {
    const check: DbcCheck = {
      queries: [{ query: "select 1 from maxattribute where objectname='WORKORDER'" }],
    };
    const xml = generateCheck(check);
    expect(xml).toContain('<check>');
    expect(xml).toContain('query="select 1 from maxattribute where objectname=&apos;WORKORDER&apos;"');
    expect(xml).toContain('</check>');
  });

  it('should generate check with custom attributes', () => {
    const check: DbcCheck = {
      tag: 'WARN',
      group: 'custom',
      key: 'AlreadyDone',
      default: 'Script already applied.',
      skip_script: false,
      queries: [{ query: 'select 1 from dual' }],
    };
    const xml = generateCheck(check);
    expect(xml).toContain('tag="WARN"');
    expect(xml).toContain('group="custom"');
    expect(xml).toContain('key="AlreadyDone"');
    expect(xml).toContain('default="Script already applied."');
    expect(xml).toContain('skip_script="false"');
  });

  it('should generate check with multiple queries', () => {
    const check: DbcCheck = {
      queries: [
        { query: 'select 1 from table1' },
        { query: 'select 1 from table2' },
      ],
    };
    const xml = generateCheck(check);
    expect(xml).toContain('query="select 1 from table1"');
    expect(xml).toContain('query="select 1 from table2"');
  });
});
