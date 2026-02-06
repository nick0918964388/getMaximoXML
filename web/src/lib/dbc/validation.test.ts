import { describe, it, expect } from 'vitest';
import { validateOperation, validateScript } from './validation';
import type { DbcOperation } from './types';

describe('validateScript', () => {
  it('should require author and scriptname', () => {
    const errors = validateScript({ author: '', scriptname: '' });
    expect(errors).toContain('author is required');
    expect(errors).toContain('scriptname is required');
  });

  it('should pass for valid config', () => {
    const errors = validateScript({ author: 'ADMIN', scriptname: 'V1000_01' });
    expect(errors).toHaveLength(0);
  });
});

describe('validateOperation', () => {
  it('should validate define_table requires object, description, service, classname, attributes', () => {
    const op: DbcOperation = {
      type: 'define_table',
      object: '',
      description: '',
      service: '',
      classname: '',
      tableType: 'system',
      attributes: [],
    };
    const errors = validateOperation(op);
    expect(errors).toContain('object is required');
    expect(errors).toContain('description is required');
    expect(errors).toContain('service is required');
    expect(errors).toContain('classname is required');
    expect(errors).toContain('At least one attribute is required');
  });

  it('should pass for valid define_table', () => {
    const errors = validateOperation({
      type: 'define_table',
      object: 'MYOBJ',
      description: 'desc',
      service: 'SVC',
      classname: 'cls',
      tableType: 'system',
      attributes: [{ attribute: 'ID', title: 'ID', remarks: 'ID' }],
    });
    expect(errors).toHaveLength(0);
  });

  it('should validate create_relationship', () => {
    const errors = validateOperation({
      type: 'create_relationship',
      parent: '',
      name: '',
      child: '',
      whereclause: '',
      remarks: '',
    });
    expect(errors).toContain('parent is required');
    expect(errors).toContain('name is required');
    expect(errors).toContain('child is required');
    expect(errors).toContain('whereclause is required');
    expect(errors).toContain('remarks is required');
  });

  it('should validate insert requires table and rows', () => {
    const errors = validateOperation({
      type: 'insert',
      table: '',
      rows: [],
    });
    expect(errors).toContain('table is required');
    expect(errors).toContain('At least one row is required');
  });

  it('should validate freeform requires description and statements', () => {
    const errors = validateOperation({
      type: 'freeform',
      description: '',
      statements: [],
    });
    expect(errors).toContain('description is required');
    expect(errors).toContain('At least one SQL statement is required');
  });

  it('should validate specify_index requires object and keys', () => {
    const errors = validateOperation({
      type: 'specify_index',
      object: '',
      keys: [],
    });
    expect(errors).toContain('object is required');
    expect(errors).toContain('At least one index key is required');
  });

  it('should validate drop_table requires object', () => {
    const errors = validateOperation({ type: 'drop_table', object: '' });
    expect(errors).toContain('object is required');
  });

  it('should validate add_attributes', () => {
    const errors = validateOperation({
      type: 'add_attributes',
      object: '',
      attributes: [],
    });
    expect(errors).toContain('object is required');
    expect(errors).toContain('At least one attribute is required');
  });

  it('should validate specify_synonym_domain', () => {
    const errors = validateOperation({
      type: 'specify_synonym_domain',
      domainid: '',
      values: [],
    });
    expect(errors).toContain('domainid is required');
    expect(errors).toContain('At least one value is required');
  });

  it('should validate add_service', () => {
    const errors = validateOperation({
      type: 'add_service',
      servicename: '',
      description: '',
      classname: '',
    });
    expect(errors).toContain('servicename is required');
    expect(errors).toContain('description is required');
    expect(errors).toContain('classname is required');
  });

  it('should validate create_app', () => {
    const errors = validateOperation({
      type: 'create_app',
      app: '',
      description: '',
    });
    expect(errors).toContain('app is required');
    expect(errors).toContain('description is required');
  });

  it('should validate add_property', () => {
    const errors = validateOperation({
      type: 'add_property',
      name: '',
      description: '',
      maxtype: 'ALN',
      secure_level: 'public',
    });
    expect(errors).toContain('name is required');
    expect(errors).toContain('description is required');
  });

  it('should validate create_maxvar', () => {
    const errors = validateOperation({
      type: 'create_maxvar',
      name: '',
      description: '',
      maxvarType: 'system',
    });
    expect(errors).toContain('name is required');
    expect(errors).toContain('description is required');
  });
});
