import type { DbcOperation } from '../types';
import { generateDefineTable, generateModifyTable, generateDropTable } from './table';
import { generateAddAttributes, generateModifyAttribute, generateDropAttributes } from './attribute';
import { generateCreateRelationship, generateModifyRelationship, generateDropRelationship } from './relationship';
import {
  generateSpecifySynonymDomain, generateAddSynonyms, generateSpecifyAlnDomain,
  generateSpecifyNumericDomain, generateSpecifyCrossoverDomain, generateSpecifyTableDomain,
  generateModifyDomainType, generateDropDomain,
} from './domain';
import { generateSpecifyIndex, generateDropIndex } from './index-op';
import {
  generateCreateApp, generateModifyApp, generateDropApp,
  generateCreateAppMenu, generateAdditionalAppMenu,
  generateAddSigOption, generateDropSigOption,
} from './application';
import { generateCreateModule, generateModifyModule, generateDropModule, generateModuleApp } from './module';
import {
  generateDefineView, generateModifyView, generateDropView,
  generateAddViewAttribute, generateDropViewAttribute, generateModifyViewAttributes,
} from './view';
import { generateAddService, generateModifyService, generateDropService } from './service';
import { generateAddProperty, generateSetProperty, generateDropProperty } from './property';
import { generateCreateMaxvar, generateModifyMaxvar, generateDropMaxvar } from './maxvar';
import { generateInsert, generateFreeform } from './data';

export { generateCheck } from './check';
export { generateDefineTable, generateModifyTable, generateDropTable, generateAttrDef } from './table';
export { generateAddAttributes, generateModifyAttribute, generateDropAttributes } from './attribute';
export { generateCreateRelationship, generateModifyRelationship, generateDropRelationship } from './relationship';
export {
  generateSpecifySynonymDomain, generateAddSynonyms, generateSpecifyAlnDomain,
  generateSpecifyNumericDomain, generateSpecifyCrossoverDomain, generateSpecifyTableDomain,
  generateModifyDomainType, generateDropDomain,
} from './domain';
export { generateSpecifyIndex, generateDropIndex } from './index-op';
export {
  generateCreateApp, generateModifyApp, generateDropApp,
  generateCreateAppMenu, generateAdditionalAppMenu,
  generateAddSigOption, generateDropSigOption,
} from './application';
export { generateCreateModule, generateModifyModule, generateDropModule, generateModuleApp } from './module';
export {
  generateDefineView, generateModifyView, generateDropView,
  generateAddViewAttribute, generateDropViewAttribute, generateModifyViewAttributes,
} from './view';
export { generateAddService, generateModifyService, generateDropService } from './service';
export { generateAddProperty, generateSetProperty, generateDropProperty } from './property';
export { generateCreateMaxvar, generateModifyMaxvar, generateDropMaxvar } from './maxvar';
export { generateInsert, generateFreeform } from './data';

export function generateOperation(op: DbcOperation): string {
  switch (op.type) {
    case 'define_table': return generateDefineTable(op);
    case 'modify_table': return generateModifyTable(op);
    case 'drop_table': return generateDropTable(op);
    case 'add_attributes': return generateAddAttributes(op);
    case 'modify_attribute': return generateModifyAttribute(op);
    case 'drop_attributes': return generateDropAttributes(op);
    case 'create_relationship': return generateCreateRelationship(op);
    case 'modify_relationship': return generateModifyRelationship(op);
    case 'drop_relationship': return generateDropRelationship(op);
    case 'specify_synonym_domain': return generateSpecifySynonymDomain(op);
    case 'add_synonyms': return generateAddSynonyms(op);
    case 'specify_aln_domain': return generateSpecifyAlnDomain(op);
    case 'specify_numeric_domain': return generateSpecifyNumericDomain(op);
    case 'specify_crossover_domain': return generateSpecifyCrossoverDomain(op);
    case 'specify_table_domain': return generateSpecifyTableDomain(op);
    case 'modify_domain_type': return generateModifyDomainType(op);
    case 'drop_domain': return generateDropDomain(op);
    case 'specify_index': return generateSpecifyIndex(op);
    case 'drop_index': return generateDropIndex(op);
    case 'create_app': return generateCreateApp(op);
    case 'modify_app': return generateModifyApp(op);
    case 'drop_app': return generateDropApp(op);
    case 'create_app_menu': return generateCreateAppMenu(op);
    case 'additional_app_menu': return generateAdditionalAppMenu(op);
    case 'add_sigoption': return generateAddSigOption(op);
    case 'drop_sigoption': return generateDropSigOption(op);
    case 'create_module': return generateCreateModule(op);
    case 'modify_module': return generateModifyModule(op);
    case 'drop_module': return generateDropModule(op);
    case 'module_app': return generateModuleApp(op);
    case 'define_view': return generateDefineView(op);
    case 'modify_view': return generateModifyView(op);
    case 'drop_view': return generateDropView(op);
    case 'add_view_attribute': return generateAddViewAttribute(op);
    case 'drop_view_attribute': return generateDropViewAttribute(op);
    case 'modify_view_attributes': return generateModifyViewAttributes(op);
    case 'add_service': return generateAddService(op);
    case 'modify_service': return generateModifyService(op);
    case 'drop_service': return generateDropService(op);
    case 'add_property': return generateAddProperty(op);
    case 'set_property': return generateSetProperty(op);
    case 'drop_property': return generateDropProperty(op);
    case 'create_maxvar': return generateCreateMaxvar(op);
    case 'modify_maxvar': return generateModifyMaxvar(op);
    case 'drop_maxvar': return generateDropMaxvar(op);
    case 'insert': return generateInsert(op);
    case 'freeform': return generateFreeform(op);
    default: {
      const _exhaustive: never = op;
      throw new Error(`Unknown operation type: ${(_exhaustive as DbcOperation).type}`);
    }
  }
}
