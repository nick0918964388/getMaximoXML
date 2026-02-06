// DBC Script Types — covers the full script.dtd specification

// ─── Shared Enums ────────────────────────────────────────────────

export type MaxType =
  | 'ALN' | 'AMOUNT' | 'BIGINT' | 'BLOB' | 'CLOB' | 'CRYPTO' | 'CRYPTOX'
  | 'DATE' | 'DATETIME' | 'DECIMAL' | 'DURATION' | 'FLOAT' | 'GL'
  | 'INTEGER' | 'LONGALN' | 'LOWER' | 'SMALLINT' | 'TIME' | 'UPPER' | 'YORN';

export type DomainMaxType = 'ALN' | 'LONGALN' | 'LOWER' | 'UPPER';

export type NumericMaxType = 'AMOUNT' | 'DECIMAL' | 'DURATION' | 'FLOAT' | 'INTEGER' | 'SMALLINT';

export type DomainModifyMaxType = 'ALN' | 'LONGALN' | 'LOWER' | 'UPPER' | 'AMOUNT' | 'DECIMAL' | 'DURATION' | 'FLOAT' | 'INTEGER' | 'SMALLINT';

export type TableType =
  | 'system' | 'site' | 'organization' | 'orgwithsite' | 'companyset'
  | 'itemset' | 'org' | 'orgappfilter' | 'orgsite' | 'siteappfilter'
  | 'systemappfilter' | 'systemorg' | 'systemorgsite' | 'systemsite';

export type ViewType =
  | 'system' | 'site' | 'companyset' | 'itemset' | 'org' | 'orgappfilter'
  | 'orgsite' | 'siteappfilter' | 'systemappfilter' | 'systemorg'
  | 'systemorgsite' | 'systemsite';

export type StorageType =
  | 'tenant' | 'master' | 'system' | 'template' | 'system_resource'
  | 'master_with_setup' | 'template_with_setup' | 'tenant_monitor';

export type MaxvarType = 'system' | 'site' | 'organization' | 'system_tenant';

export type SearchType = 'WILDCARD' | 'EXACT' | 'NONE' | 'TEXT';

export type SqlTarget = 'oracle' | 'sqlserver' | 'db2' | 'all' | 'not_oracle' | 'not_sqlserver' | 'not_db2';

export type ScriptContext = 'master' | 'landlord' | 'tenants' | 'all';

export type PropertyMaxType = 'ALN' | 'INTEGER' | 'YORN';

export type PropertyScope = 'global' | 'instance' | 'open';

export type PropertySecureLevel = 'private' | 'public' | 'secure' | 'mtsecure';

export type PropertyValueRules = 'ONONLY' | 'OFFONLY' | 'INCONLY' | 'DECONLY' | 'NONE';

export type PropertyAccessType = '0' | '1' | '2' | '3' | 'master' | 'landlord' | 'delta' | 'tenant';

export type MenuType = 'action' | 'tool' | 'search';

export type MenuPosition = 'first' | 'last' | 'before' | 'after';

export type TabDisplay = 'LIST' | 'MAIN' | 'ALL';

// ─── Script Config ───────────────────────────────────────────────

export interface DbcScriptConfig {
  author: string;
  scriptname: string;
  description?: string;
  for_demo_only?: boolean;
  context?: ScriptContext;
  tenantcode?: string;
}

// ─── Check ───────────────────────────────────────────────────────

export interface DbcCheckQuery {
  query: string;
}

export interface DbcCheck {
  tag?: string;
  group?: string;
  key?: string;
  default?: string;
  skip_script?: boolean;
  queries: DbcCheckQuery[];
}

// ─── Attribute Definitions (shared) ──────────────────────────────

export interface AttrDef {
  attribute: string;
  maxtype?: MaxType;
  length?: number;
  persistent?: boolean;
  haslongdesc?: boolean;
  required?: boolean;
  userdefined?: boolean;
  domain?: string;
  classname?: string;
  defaultvalue?: string;
  title: string;
  remarks: string;
  sameasobject?: string;
  sameasattribute?: string;
  mustbe?: boolean;
  ispositive?: boolean;
  scale?: number;
  autokey?: string;
  canautonum?: boolean;
  searchtype?: SearchType;
  localizable?: boolean;
  domainlink?: string;
  restricted?: boolean;
}

export interface AttrName {
  name: string;
}

// ─── Index Key ───────────────────────────────────────────────────

export interface IndexKey {
  column: string;
  ascending?: boolean;
}

// ─── Domain Value Types ──────────────────────────────────────────

export interface SynonymValueInfo {
  value: string;
  maxvalue: string;
  defaults: boolean;
  description?: string;
}

export interface AlnValueInfo {
  value: string;
  description?: string;
}

export interface NumericValueInfo {
  value: string;
  description?: string;
}

export interface CrossoverValueInfo {
  sourcefield: string;
  destfield?: string;
  copyifnull?: boolean;
  copyevenifsrcnull?: boolean;
  copyonlyifdestnull?: boolean;
}

// ─── Insert Types ────────────────────────────────────────────────

export interface ColumnValue {
  column: string;
  string?: string;
  fromcolumn?: string;
  boolean?: boolean;
  number?: string;
}

export interface InsertRow {
  columns: ColumnValue[];
}

// ─── SQL for Freeform ────────────────────────────────────────────

export interface SqlStatement {
  target?: SqlTarget;
  sql: string;
}

// ─── View Types ──────────────────────────────────────────────────

export interface ViewColumn {
  table: string;
  column: string;
  view_column: string;
  same_storage_as?: string;
}

export interface ViewTable {
  name: string;
}

export interface ModifyViewData {
  view_column: string;
  new_name?: string;
  table?: string;
  column?: string;
  same_storage_as?: string;
}

// ─── App Menu Types ──────────────────────────────────────────────

export interface AppMenuOption {
  type: 'option';
  option: string;
  image?: string;
  accesskey?: string;
  tabdisplay: TabDisplay;
}

export interface MenuSeparator {
  type: 'separator';
  tabdisplay?: TabDisplay;
}

export interface AppMenuHeader {
  type: 'header';
  headerdescription: string;
  image?: string;
  tabdisplay?: TabDisplay;
  items: (AppMenuOption | MenuSeparator)[];
}

export type AppMenuItem = AppMenuOption | MenuSeparator | AppMenuHeader;

// ─── Module Menu Types ───────────────────────────────────────────

export interface ModuleMenuApp {
  type: 'app';
  app: string;
  image?: string;
}

export interface ModuleMenuHeader {
  type: 'header';
  headerdescription: string;
  apps: ModuleMenuApp[];
}

export type ModuleMenuItem = ModuleMenuApp | ModuleMenuHeader;

// ─── Operations (Discriminated Union) ────────────────────────────

// Table
export interface DefineTableOp {
  type: 'define_table';
  object: string;
  description: string;
  service: string;
  classname: string;
  persistent?: boolean;
  tableType: TableType;
  primarykey?: string;
  mainobject?: boolean;
  internal?: boolean;
  trigroot?: string;
  storagetype?: StorageType;
  attributes: AttrDef[];
}

export interface ModifyTableOp {
  type: 'modify_table';
  name: string;
  object?: string;
  description?: string;
  service?: string;
  classname?: string;
  tableType?: TableType;
  primarykey?: string;
  mainobject?: boolean;
  internal?: boolean;
  trigroot?: string;
  unique_column?: string;
  storagetype?: StorageType;
}

export interface DropTableOp {
  type: 'drop_table';
  object: string;
}

// Attribute
export interface AddAttributesOp {
  type: 'add_attributes';
  object: string;
  attributes: AttrDef[];
}

export interface ModifyAttributeOp {
  type: 'modify_attribute';
  object: string;
  attribute: string;
  maxtype?: MaxType;
  length?: number;
  persistent?: boolean;
  haslongdesc?: boolean;
  required?: boolean;
  userdefined?: boolean;
  domain?: string;
  classname?: string;
  defaultvalue?: string;
  title?: string;
  remarks?: string;
  sameasobject?: string;
  sameasattribute?: string;
  mustbe?: boolean;
  ispositive?: boolean;
  scale?: number;
  autokey?: string;
  canautonum?: boolean;
  searchtype?: SearchType;
  localizable?: boolean;
  domainlink?: string;
  restricted?: boolean;
  excludetenants?: string;
}

export interface DropAttributesOp {
  type: 'drop_attributes';
  object: string;
  attributes: AttrName[];
}

// Relationship
export interface CreateRelationshipOp {
  type: 'create_relationship';
  parent: string;
  name: string;
  child: string;
  whereclause: string;
  remarks: string;
}

export interface ModifyRelationshipOp {
  type: 'modify_relationship';
  parent: string;
  name: string;
  child?: string;
  whereclause?: string;
  remarks?: string;
}

export interface DropRelationshipOp {
  type: 'drop_relationship';
  parent: string;
  name: string;
}

// Domain
export interface SpecifySynonymDomainOp {
  type: 'specify_synonym_domain';
  domainid: string;
  description?: string;
  maxtype?: DomainMaxType;
  length?: number;
  overwrite?: boolean;
  internal?: boolean;
  values: SynonymValueInfo[];
}

export interface AddSynonymsOp {
  type: 'add_synonyms';
  domainid: string;
  values: SynonymValueInfo[];
}

export interface SpecifyAlnDomainOp {
  type: 'specify_aln_domain';
  domainid: string;
  description?: string;
  maxtype?: DomainMaxType;
  length?: number;
  overwrite?: boolean;
  internal?: boolean;
  values: AlnValueInfo[];
}

export interface SpecifyNumericDomainOp {
  type: 'specify_numeric_domain';
  domainid: string;
  description?: string;
  maxtype?: NumericMaxType;
  length?: number;
  scale?: number;
  overwrite?: boolean;
  internal?: boolean;
  values: NumericValueInfo[];
}

export interface SpecifyCrossoverDomainOp {
  type: 'specify_crossover_domain';
  domainid: string;
  description?: string;
  overwrite?: boolean;
  validationwhereclause: string;
  listwhereclause?: string;
  errorbundle?: string;
  errorkey?: string;
  objectname: string;
  internal?: boolean;
  values: CrossoverValueInfo[];
}

export interface SpecifyTableDomainOp {
  type: 'specify_table_domain';
  domainid: string;
  description?: string;
  overwrite?: boolean;
  validationwhereclause: string;
  listwhereclause?: string;
  errorbundle?: string;
  errorkey?: string;
  objectname: string;
  internal?: boolean;
}

export interface ModifyDomainTypeOp {
  type: 'modify_domain_type';
  domain: string;
  maxtype?: DomainModifyMaxType;
  length?: number;
  scale?: number;
}

export interface DropDomainOp {
  type: 'drop_domain';
  domainid: string;
}

// Index
export interface SpecifyIndexOp {
  type: 'specify_index';
  name?: string;
  object: string;
  primary?: boolean;
  unique?: boolean;
  clustered?: boolean;
  required?: boolean;
  addtenantid?: boolean;
  keys: IndexKey[];
}

export interface DropIndexOp {
  type: 'drop_index';
  name?: string;
  object: string;
  keys?: IndexKey[];
}

// Application
export interface CreateAppOp {
  type: 'create_app';
  app: string;
  description: string;
  restrictions?: string;
  orderby?: string;
  maintbname?: string;
}

export interface ModifyAppOp {
  type: 'modify_app';
  app: string;
  description?: string;
  restrictions?: string;
  orderby?: string;
  maintbname?: string;
}

export interface DropAppOp {
  type: 'drop_app';
  app: string;
}

export interface CreateAppMenuOp {
  type: 'create_app_menu';
  app: string;
  menuType?: MenuType;
  items: AppMenuItem[];
}

export interface AdditionalAppMenuOp {
  type: 'additional_app_menu';
  app: string;
  menuType?: MenuType;
  menu_position?: MenuPosition;
  pos_param?: string;
  items: AppMenuItem[];
}

export interface AddSigOptionOp {
  type: 'add_sigoption';
  app: string;
  optionname: string;
  description: string;
  esigenabled?: boolean;
  visible?: boolean;
  alsogrants?: string;
  alsorevokes?: string;
  prerequisite?: string;
  langcode?: string;
  grantapp?: string;
  grantoption?: string;
  granteveryone?: boolean;
  grantcondition?: string;
}

export interface DropSigOptionOp {
  type: 'drop_sigoption';
  app: string;
  optionname: string;
}

// Module
export interface CreateModuleOp {
  type: 'create_module';
  module: string;
  description: string;
  menu_position?: MenuPosition;
  menu_param?: string;
  image?: string;
  items: ModuleMenuItem[];
}

export interface ModifyModuleOp {
  type: 'modify_module';
  module: string;
  description?: string;
  menu_position?: MenuPosition;
  menu_pos_param?: string;
  image?: string;
}

export interface DropModuleOp {
  type: 'drop_module';
  module: string;
}

export interface ModuleAppOp {
  type: 'module_app';
  module: string;
  app: string;
  menu_position?: MenuPosition;
  menu_pos_param?: string;
  image?: string;
}

// View
export interface DefineViewOp {
  type: 'define_view';
  name: string;
  description: string;
  service: string;
  classname: string;
  extends?: string;
  viewType: ViewType;
  mainobject?: boolean;
  internal?: boolean;
  // Two modes: autoselect with tables + optional columns, or columns + select/from
  mode: 'autoselect' | 'custom';
  tables?: ViewTable[];
  columns?: ViewColumn[];
  view_select?: string;
  view_from?: string;
  view_where: string;
}

export interface ModifyViewOp {
  type: 'modify_view';
  name: string;
  classname?: string;
  description?: string;
  mainobject?: boolean;
  internal?: boolean;
  service?: string;
  viewType?: ViewType;
  view_select?: string;
  view_from?: string;
  view_where?: string;
}

export interface DropViewOp {
  type: 'drop_view';
  name: string;
}

export interface AddViewAttributeOp {
  type: 'add_view_attribute';
  view: string;
  view_column: string;
  table: string;
  column: string;
  same_storage_as?: string;
}

export interface DropViewAttributeOp {
  type: 'drop_view_attribute';
  view: string;
  attribute: string;
}

export interface ModifyViewAttributesOp {
  type: 'modify_view_attributes';
  view: string;
  modifications: ModifyViewData[];
}

// Service
export interface AddServiceOp {
  type: 'add_service';
  servicename: string;
  description: string;
  classname: string;
  singleton?: boolean;
}

export interface ModifyServiceOp {
  type: 'modify_service';
  servicename: string;
  description?: string;
  classname?: string;
  singleton?: boolean;
}

export interface DropServiceOp {
  type: 'drop_service';
  servicename: string;
}

// Property
export interface AddPropertyOp {
  type: 'add_property';
  name: string;
  description: string;
  maxtype: PropertyMaxType;
  domainid?: string;
  scope?: PropertyScope;
  secure_level: PropertySecureLevel;
  live_refresh?: boolean;
  required?: boolean;
  online_changes?: boolean;
  user_defined?: boolean;
  default_value?: string;
  encrypted?: boolean;
  masked?: boolean;
  value?: string;
  valuerules?: PropertyValueRules;
  accesstype?: PropertyAccessType;
}

export interface SetPropertyOp {
  type: 'set_property';
  name: string;
  value: string;
}

export interface DropPropertyOp {
  type: 'drop_property';
  name: string;
}

// Maxvar
export interface CreateMaxvarOp {
  type: 'create_maxvar';
  name: string;
  description: string;
  default?: string;
  maxvarType: MaxvarType;
}

export interface ModifyMaxvarOp {
  type: 'modify_maxvar';
  name: string;
  description?: string;
  default?: string;
  maxvarType?: MaxvarType;
}

export interface DropMaxvarOp {
  type: 'drop_maxvar';
  name: string;
}

// Data
export interface InsertOp {
  type: 'insert';
  table: string;
  selectfrom?: string;
  selectwhere?: string;
  ignore_duplicates?: boolean;
  rows: InsertRow[];
}

export interface FreeformOp {
  type: 'freeform';
  description: string;
  statements: SqlStatement[];
}

// ─── Union Type ──────────────────────────────────────────────────

export type DbcOperation =
  // Table
  | DefineTableOp
  | ModifyTableOp
  | DropTableOp
  // Attribute
  | AddAttributesOp
  | ModifyAttributeOp
  | DropAttributesOp
  // Relationship
  | CreateRelationshipOp
  | ModifyRelationshipOp
  | DropRelationshipOp
  // Domain
  | SpecifySynonymDomainOp
  | AddSynonymsOp
  | SpecifyAlnDomainOp
  | SpecifyNumericDomainOp
  | SpecifyCrossoverDomainOp
  | SpecifyTableDomainOp
  | ModifyDomainTypeOp
  | DropDomainOp
  // Index
  | SpecifyIndexOp
  | DropIndexOp
  // Application
  | CreateAppOp
  | ModifyAppOp
  | DropAppOp
  | CreateAppMenuOp
  | AdditionalAppMenuOp
  | AddSigOptionOp
  | DropSigOptionOp
  // Module
  | CreateModuleOp
  | ModifyModuleOp
  | DropModuleOp
  | ModuleAppOp
  // View
  | DefineViewOp
  | ModifyViewOp
  | DropViewOp
  | AddViewAttributeOp
  | DropViewAttributeOp
  | ModifyViewAttributesOp
  // Service
  | AddServiceOp
  | ModifyServiceOp
  | DropServiceOp
  // Property
  | AddPropertyOp
  | SetPropertyOp
  | DropPropertyOp
  // Maxvar
  | CreateMaxvarOp
  | ModifyMaxvarOp
  | DropMaxvarOp
  // Data
  | InsertOp
  | FreeformOp;

export type DbcOperationType = DbcOperation['type'];

// ─── Builder State ───────────────────────────────────────────────

export interface DbcOperationEntry {
  id: string;
  operation: DbcOperation;
  collapsed?: boolean;
}

export interface DbcBuilderState {
  script: DbcScriptConfig;
  checks: DbcCheck[];
  operations: DbcOperationEntry[];
  selectedId: string | null;
}

// ─── Operation Categories ────────────────────────────────────────

export interface OperationCategoryItem {
  type: DbcOperationType;
  label: string;
  description: string;
}

export interface OperationCategory {
  name: string;
  items: OperationCategoryItem[];
}

export const OPERATION_CATEGORIES: OperationCategory[] = [
  {
    name: 'Table',
    items: [
      { type: 'define_table', label: 'Define Table', description: 'Create a new table/object' },
      { type: 'modify_table', label: 'Modify Table', description: 'Modify table metadata' },
      { type: 'drop_table', label: 'Drop Table', description: 'Drop a table/object' },
    ],
  },
  {
    name: 'Attribute',
    items: [
      { type: 'add_attributes', label: 'Add Attributes', description: 'Add attributes to an object' },
      { type: 'modify_attribute', label: 'Modify Attribute', description: 'Modify a single attribute' },
      { type: 'drop_attributes', label: 'Drop Attributes', description: 'Drop attributes from an object' },
    ],
  },
  {
    name: 'Relationship',
    items: [
      { type: 'create_relationship', label: 'Create Relationship', description: 'Create a relationship' },
      { type: 'modify_relationship', label: 'Modify Relationship', description: 'Modify an existing relationship' },
      { type: 'drop_relationship', label: 'Drop Relationship', description: 'Drop a relationship' },
    ],
  },
  {
    name: 'Domain',
    items: [
      { type: 'specify_synonym_domain', label: 'Synonym Domain', description: 'Create/specify synonym domain' },
      { type: 'add_synonyms', label: 'Add Synonyms', description: 'Add synonyms to existing domain' },
      { type: 'specify_aln_domain', label: 'ALN Domain', description: 'Create/specify ALN domain' },
      { type: 'specify_numeric_domain', label: 'Numeric Domain', description: 'Create/specify numeric domain' },
      { type: 'specify_crossover_domain', label: 'Crossover Domain', description: 'Create/specify crossover domain' },
      { type: 'specify_table_domain', label: 'Table Domain', description: 'Create/specify table domain' },
      { type: 'modify_domain_type', label: 'Modify Domain Type', description: 'Modify domain maxtype/length' },
      { type: 'drop_domain', label: 'Drop Domain', description: 'Drop a domain' },
    ],
  },
  {
    name: 'Index',
    items: [
      { type: 'specify_index', label: 'Specify Index', description: 'Create or modify an index' },
      { type: 'drop_index', label: 'Drop Index', description: 'Drop an index' },
    ],
  },
  {
    name: 'Application',
    items: [
      { type: 'create_app', label: 'Create App', description: 'Create an application' },
      { type: 'modify_app', label: 'Modify App', description: 'Modify an application' },
      { type: 'drop_app', label: 'Drop App', description: 'Drop an application' },
      { type: 'create_app_menu', label: 'Create App Menu', description: 'Create application menu' },
      { type: 'additional_app_menu', label: 'Additional App Menu', description: 'Add to existing app menu' },
      { type: 'add_sigoption', label: 'Add Sig Option', description: 'Add security sig option' },
      { type: 'drop_sigoption', label: 'Drop Sig Option', description: 'Drop a sig option' },
    ],
  },
  {
    name: 'Module',
    items: [
      { type: 'create_module', label: 'Create Module', description: 'Create a module' },
      { type: 'modify_module', label: 'Modify Module', description: 'Modify a module' },
      { type: 'drop_module', label: 'Drop Module', description: 'Drop a module' },
      { type: 'module_app', label: 'Module App', description: 'Add app to module menu' },
    ],
  },
  {
    name: 'View',
    items: [
      { type: 'define_view', label: 'Define View', description: 'Create a view' },
      { type: 'modify_view', label: 'Modify View', description: 'Modify a view' },
      { type: 'drop_view', label: 'Drop View', description: 'Drop a view' },
      { type: 'add_view_attribute', label: 'Add View Attribute', description: 'Add view column' },
      { type: 'drop_view_attribute', label: 'Drop View Attribute', description: 'Drop view column' },
      { type: 'modify_view_attributes', label: 'Modify View Attributes', description: 'Modify view columns' },
    ],
  },
  {
    name: 'Service',
    items: [
      { type: 'add_service', label: 'Add Service', description: 'Add a service' },
      { type: 'modify_service', label: 'Modify Service', description: 'Modify a service' },
      { type: 'drop_service', label: 'Drop Service', description: 'Drop a service' },
    ],
  },
  {
    name: 'Property',
    items: [
      { type: 'add_property', label: 'Add Property', description: 'Add a system property' },
      { type: 'set_property', label: 'Set Property', description: 'Set property value' },
      { type: 'drop_property', label: 'Drop Property', description: 'Drop a property' },
    ],
  },
  {
    name: 'Maxvar',
    items: [
      { type: 'create_maxvar', label: 'Create Maxvar', description: 'Create a maxvar' },
      { type: 'modify_maxvar', label: 'Modify Maxvar', description: 'Modify a maxvar' },
      { type: 'drop_maxvar', label: 'Drop Maxvar', description: 'Drop a maxvar' },
    ],
  },
  {
    name: 'Data',
    items: [
      { type: 'insert', label: 'Insert', description: 'Insert rows into a table' },
      { type: 'freeform', label: 'Freeform SQL', description: 'Execute freeform SQL' },
    ],
  },
];
