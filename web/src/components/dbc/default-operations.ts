import type { DbcOperation, DbcOperationType } from '@/lib/dbc/types';

export function createDefaultOperation(type: DbcOperationType): DbcOperation {
  switch (type) {
    case 'define_table':
      return { type, object: '', description: '', service: '', classname: '', tableType: 'system', attributes: [] };
    case 'modify_table':
      return { type, name: '' };
    case 'drop_table':
      return { type, object: '' };
    case 'add_attributes':
      return { type, object: '', attributes: [] };
    case 'modify_attribute':
      return { type, object: '', attribute: '' };
    case 'drop_attributes':
      return { type, object: '', attributes: [] };
    case 'create_relationship':
      return { type, parent: '', name: '', child: '', whereclause: '', remarks: '' };
    case 'modify_relationship':
      return { type, parent: '', name: '' };
    case 'drop_relationship':
      return { type, parent: '', name: '' };
    case 'specify_synonym_domain':
      return { type, domainid: '', values: [] };
    case 'add_synonyms':
      return { type, domainid: '', values: [] };
    case 'specify_aln_domain':
      return { type, domainid: '', values: [] };
    case 'specify_numeric_domain':
      return { type, domainid: '', values: [] };
    case 'specify_crossover_domain':
      return { type, domainid: '', validationwhereclause: '', objectname: '', values: [] };
    case 'specify_table_domain':
      return { type, domainid: '', validationwhereclause: '', objectname: '' };
    case 'modify_domain_type':
      return { type, domain: '' };
    case 'drop_domain':
      return { type, domainid: '' };
    case 'specify_index':
      return { type, object: '', keys: [] };
    case 'drop_index':
      return { type, object: '' };
    case 'create_app':
      return { type, app: '', description: '' };
    case 'modify_app':
      return { type, app: '' };
    case 'drop_app':
      return { type, app: '' };
    case 'create_app_menu':
      return { type, app: '', items: [] };
    case 'additional_app_menu':
      return { type, app: '', items: [] };
    case 'add_sigoption':
      return { type, app: '', optionname: '', description: '' };
    case 'drop_sigoption':
      return { type, app: '', optionname: '' };
    case 'create_module':
      return { type, module: '', description: '', items: [] };
    case 'modify_module':
      return { type, module: '' };
    case 'drop_module':
      return { type, module: '' };
    case 'module_app':
      return { type, module: '', app: '' };
    case 'define_view':
      return { type, name: '', description: '', service: '', classname: '', viewType: 'system', mode: 'autoselect', view_where: '' };
    case 'modify_view':
      return { type, name: '' };
    case 'drop_view':
      return { type, name: '' };
    case 'add_view_attribute':
      return { type, view: '', view_column: '', table: '', column: '' };
    case 'drop_view_attribute':
      return { type, view: '', attribute: '' };
    case 'modify_view_attributes':
      return { type, view: '', modifications: [] };
    case 'add_service':
      return { type, servicename: '', description: '', classname: '' };
    case 'modify_service':
      return { type, servicename: '' };
    case 'drop_service':
      return { type, servicename: '' };
    case 'add_property':
      return { type, name: '', description: '', maxtype: 'ALN', secure_level: 'public' };
    case 'set_property':
      return { type, name: '', value: '' };
    case 'drop_property':
      return { type, name: '' };
    case 'create_maxvar':
      return { type, name: '', description: '', maxvarType: 'system' };
    case 'modify_maxvar':
      return { type, name: '' };
    case 'drop_maxvar':
      return { type, name: '' };
    case 'insert':
      return { type, table: '', rows: [] };
    case 'freeform':
      return { type, description: '', statements: [] };
  }
}
