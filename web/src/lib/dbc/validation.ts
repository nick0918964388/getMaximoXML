import type { DbcOperation, DbcScriptConfig } from './types';

function requireField(errors: string[], value: string | undefined, field: string): void {
  if (!value || value.trim() === '') {
    errors.push(`${field} is required`);
  }
}

function requireArray(errors: string[], arr: unknown[], label: string): void {
  if (arr.length === 0) {
    errors.push(`At least one ${label} is required`);
  }
}

export function validateScript(config: DbcScriptConfig): string[] {
  const errors: string[] = [];
  requireField(errors, config.author, 'author');
  requireField(errors, config.scriptname, 'scriptname');
  return errors;
}

export function validateOperation(op: DbcOperation): string[] {
  const errors: string[] = [];

  switch (op.type) {
    case 'define_table':
      requireField(errors, op.object, 'object');
      requireField(errors, op.description, 'description');
      requireField(errors, op.service, 'service');
      requireField(errors, op.classname, 'classname');
      requireArray(errors, op.attributes, 'attribute');
      break;
    case 'modify_table':
      requireField(errors, op.name, 'name');
      break;
    case 'drop_table':
      requireField(errors, op.object, 'object');
      break;
    case 'add_attributes':
      requireField(errors, op.object, 'object');
      requireArray(errors, op.attributes, 'attribute');
      break;
    case 'modify_attribute':
      requireField(errors, op.object, 'object');
      requireField(errors, op.attribute, 'attribute');
      break;
    case 'drop_attributes':
      requireField(errors, op.object, 'object');
      requireArray(errors, op.attributes, 'attribute');
      break;
    case 'create_relationship':
      requireField(errors, op.parent, 'parent');
      requireField(errors, op.name, 'name');
      requireField(errors, op.child, 'child');
      requireField(errors, op.whereclause, 'whereclause');
      requireField(errors, op.remarks, 'remarks');
      break;
    case 'modify_relationship':
      requireField(errors, op.parent, 'parent');
      requireField(errors, op.name, 'name');
      break;
    case 'drop_relationship':
      requireField(errors, op.parent, 'parent');
      requireField(errors, op.name, 'name');
      break;
    case 'specify_synonym_domain':
      requireField(errors, op.domainid, 'domainid');
      requireArray(errors, op.values, 'value');
      break;
    case 'add_synonyms':
      requireField(errors, op.domainid, 'domainid');
      requireArray(errors, op.values, 'value');
      break;
    case 'specify_aln_domain':
      requireField(errors, op.domainid, 'domainid');
      requireArray(errors, op.values, 'value');
      break;
    case 'specify_numeric_domain':
      requireField(errors, op.domainid, 'domainid');
      requireArray(errors, op.values, 'value');
      break;
    case 'specify_crossover_domain':
      requireField(errors, op.domainid, 'domainid');
      requireField(errors, op.validationwhereclause, 'validationwhereclause');
      requireField(errors, op.objectname, 'objectname');
      requireArray(errors, op.values, 'value');
      break;
    case 'specify_table_domain':
      requireField(errors, op.domainid, 'domainid');
      requireField(errors, op.validationwhereclause, 'validationwhereclause');
      requireField(errors, op.objectname, 'objectname');
      break;
    case 'modify_domain_type':
      requireField(errors, op.domain, 'domain');
      break;
    case 'drop_domain':
      requireField(errors, op.domainid, 'domainid');
      break;
    case 'specify_index':
      requireField(errors, op.object, 'object');
      requireArray(errors, op.keys, 'index key');
      break;
    case 'drop_index':
      requireField(errors, op.object, 'object');
      break;
    case 'create_app':
      requireField(errors, op.app, 'app');
      requireField(errors, op.description, 'description');
      break;
    case 'modify_app':
      requireField(errors, op.app, 'app');
      break;
    case 'drop_app':
      requireField(errors, op.app, 'app');
      break;
    case 'create_app_menu':
      requireField(errors, op.app, 'app');
      requireArray(errors, op.items, 'menu item');
      break;
    case 'additional_app_menu':
      requireField(errors, op.app, 'app');
      requireArray(errors, op.items, 'menu item');
      break;
    case 'add_sigoption':
      requireField(errors, op.app, 'app');
      requireField(errors, op.optionname, 'optionname');
      requireField(errors, op.description, 'description');
      break;
    case 'drop_sigoption':
      requireField(errors, op.app, 'app');
      requireField(errors, op.optionname, 'optionname');
      break;
    case 'create_module':
      requireField(errors, op.module, 'module');
      requireField(errors, op.description, 'description');
      requireArray(errors, op.items, 'menu item');
      break;
    case 'modify_module':
      requireField(errors, op.module, 'module');
      break;
    case 'drop_module':
      requireField(errors, op.module, 'module');
      break;
    case 'module_app':
      requireField(errors, op.module, 'module');
      requireField(errors, op.app, 'app');
      break;
    case 'define_view':
      requireField(errors, op.name, 'name');
      requireField(errors, op.description, 'description');
      requireField(errors, op.service, 'service');
      requireField(errors, op.classname, 'classname');
      requireField(errors, op.view_where, 'view_where');
      break;
    case 'modify_view':
      requireField(errors, op.name, 'name');
      break;
    case 'drop_view':
      requireField(errors, op.name, 'name');
      break;
    case 'add_view_attribute':
      requireField(errors, op.view, 'view');
      requireField(errors, op.view_column, 'view_column');
      requireField(errors, op.table, 'table');
      requireField(errors, op.column, 'column');
      break;
    case 'drop_view_attribute':
      requireField(errors, op.view, 'view');
      requireField(errors, op.attribute, 'attribute');
      break;
    case 'modify_view_attributes':
      requireField(errors, op.view, 'view');
      requireArray(errors, op.modifications, 'modification');
      break;
    case 'add_service':
      requireField(errors, op.servicename, 'servicename');
      requireField(errors, op.description, 'description');
      requireField(errors, op.classname, 'classname');
      break;
    case 'modify_service':
      requireField(errors, op.servicename, 'servicename');
      break;
    case 'drop_service':
      requireField(errors, op.servicename, 'servicename');
      break;
    case 'add_property':
      requireField(errors, op.name, 'name');
      requireField(errors, op.description, 'description');
      break;
    case 'set_property':
      requireField(errors, op.name, 'name');
      requireField(errors, op.value, 'value');
      break;
    case 'drop_property':
      requireField(errors, op.name, 'name');
      break;
    case 'create_maxvar':
      requireField(errors, op.name, 'name');
      requireField(errors, op.description, 'description');
      break;
    case 'modify_maxvar':
      requireField(errors, op.name, 'name');
      break;
    case 'drop_maxvar':
      requireField(errors, op.name, 'name');
      break;
    case 'insert':
      requireField(errors, op.table, 'table');
      requireArray(errors, op.rows, 'row');
      break;
    case 'freeform':
      requireField(errors, op.description, 'description');
      requireArray(errors, op.statements, 'SQL statement');
      break;
  }

  return errors;
}
