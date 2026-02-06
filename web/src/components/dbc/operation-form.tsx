'use client';

import type { DbcOperation } from '@/lib/dbc/types';
import { DefineTableForm, ModifyTableForm, DropTableForm } from './forms/table-forms';
import { AddAttributesForm, ModifyAttributeForm, DropAttributesForm } from './forms/attribute-forms';
import { CreateRelationshipForm, ModifyRelationshipForm, DropRelationshipForm } from './forms/relationship-forms';
import {
  SpecifySynonymDomainForm, AddSynonymsForm, SpecifyAlnDomainForm,
  SpecifyNumericDomainForm, SpecifyCrossoverDomainForm, SpecifyTableDomainForm,
  ModifyDomainTypeForm, DropDomainForm,
} from './forms/domain-forms';
import { SpecifyIndexForm, DropIndexForm } from './forms/index-forms';
import { CreateAppForm, ModifyAppForm, DropAppForm, AddSigOptionForm, DropSigOptionForm } from './forms/application-forms';
import { CreateModuleForm, ModifyModuleForm, DropModuleForm, ModuleAppForm } from './forms/module-forms';
import { DefineViewForm, ModifyViewForm, DropViewForm, AddViewAttributeForm, DropViewAttributeForm, ModifyViewAttributesForm } from './forms/view-forms';
import { AddServiceForm, ModifyServiceForm, DropServiceForm } from './forms/service-forms';
import { AddPropertyForm, SetPropertyForm, DropPropertyForm } from './forms/property-forms';
import { CreateMaxvarForm, ModifyMaxvarForm, DropMaxvarForm } from './forms/maxvar-forms';
import { InsertForm, FreeformForm } from './forms/data-forms';

interface OperationFormProps {
  operation: DbcOperation;
  onChange: (op: DbcOperation) => void;
}

export function OperationForm({ operation, onChange }: OperationFormProps) {
  switch (operation.type) {
    case 'define_table': return <DefineTableForm value={operation} onChange={onChange} />;
    case 'modify_table': return <ModifyTableForm value={operation} onChange={onChange} />;
    case 'drop_table': return <DropTableForm value={operation} onChange={onChange} />;
    case 'add_attributes': return <AddAttributesForm value={operation} onChange={onChange} />;
    case 'modify_attribute': return <ModifyAttributeForm value={operation} onChange={onChange} />;
    case 'drop_attributes': return <DropAttributesForm value={operation} onChange={onChange} />;
    case 'create_relationship': return <CreateRelationshipForm value={operation} onChange={onChange} />;
    case 'modify_relationship': return <ModifyRelationshipForm value={operation} onChange={onChange} />;
    case 'drop_relationship': return <DropRelationshipForm value={operation} onChange={onChange} />;
    case 'specify_synonym_domain': return <SpecifySynonymDomainForm value={operation} onChange={onChange} />;
    case 'add_synonyms': return <AddSynonymsForm value={operation} onChange={onChange} />;
    case 'specify_aln_domain': return <SpecifyAlnDomainForm value={operation} onChange={onChange} />;
    case 'specify_numeric_domain': return <SpecifyNumericDomainForm value={operation} onChange={onChange} />;
    case 'specify_crossover_domain': return <SpecifyCrossoverDomainForm value={operation} onChange={onChange} />;
    case 'specify_table_domain': return <SpecifyTableDomainForm value={operation} onChange={onChange} />;
    case 'modify_domain_type': return <ModifyDomainTypeForm value={operation} onChange={onChange} />;
    case 'drop_domain': return <DropDomainForm value={operation} onChange={onChange} />;
    case 'specify_index': return <SpecifyIndexForm value={operation} onChange={onChange} />;
    case 'drop_index': return <DropIndexForm value={operation} onChange={onChange} />;
    case 'create_app': return <CreateAppForm value={operation} onChange={onChange} />;
    case 'modify_app': return <ModifyAppForm value={operation} onChange={onChange} />;
    case 'drop_app': return <DropAppForm value={operation} onChange={onChange} />;
    case 'create_app_menu': return <div className="text-sm text-muted-foreground">App Menu: {operation.app} (edit via XML preview)</div>;
    case 'additional_app_menu': return <div className="text-sm text-muted-foreground">Additional App Menu: {operation.app} (edit via XML preview)</div>;
    case 'add_sigoption': return <AddSigOptionForm value={operation} onChange={onChange} />;
    case 'drop_sigoption': return <DropSigOptionForm value={operation} onChange={onChange} />;
    case 'create_module': return <CreateModuleForm value={operation} onChange={onChange} />;
    case 'modify_module': return <ModifyModuleForm value={operation} onChange={onChange} />;
    case 'drop_module': return <DropModuleForm value={operation} onChange={onChange} />;
    case 'module_app': return <ModuleAppForm value={operation} onChange={onChange} />;
    case 'define_view': return <DefineViewForm value={operation} onChange={onChange} />;
    case 'modify_view': return <ModifyViewForm value={operation} onChange={onChange} />;
    case 'drop_view': return <DropViewForm value={operation} onChange={onChange} />;
    case 'add_view_attribute': return <AddViewAttributeForm value={operation} onChange={onChange} />;
    case 'drop_view_attribute': return <DropViewAttributeForm value={operation} onChange={onChange} />;
    case 'modify_view_attributes': return <ModifyViewAttributesForm value={operation} onChange={onChange} />;
    case 'add_service': return <AddServiceForm value={operation} onChange={onChange} />;
    case 'modify_service': return <ModifyServiceForm value={operation} onChange={onChange} />;
    case 'drop_service': return <DropServiceForm value={operation} onChange={onChange} />;
    case 'add_property': return <AddPropertyForm value={operation} onChange={onChange} />;
    case 'set_property': return <SetPropertyForm value={operation} onChange={onChange} />;
    case 'drop_property': return <DropPropertyForm value={operation} onChange={onChange} />;
    case 'create_maxvar': return <CreateMaxvarForm value={operation} onChange={onChange} />;
    case 'modify_maxvar': return <ModifyMaxvarForm value={operation} onChange={onChange} />;
    case 'drop_maxvar': return <DropMaxvarForm value={operation} onChange={onChange} />;
    case 'insert': return <InsertForm value={operation} onChange={onChange} />;
    case 'freeform': return <FreeformForm value={operation} onChange={onChange} />;
    default: return <div className="text-sm text-muted-foreground">Unknown operation type</div>;
  }
}
