import type {
  DbcBuilderState, DbcScriptConfig, DbcCheck, DbcCheckQuery,
  DbcOperationEntry, DbcOperation, AttrDef, AttrName, IndexKey,
  SynonymValueInfo, AlnValueInfo, NumericValueInfo, CrossoverValueInfo,
  ColumnValue, InsertRow, SqlStatement, ViewColumn, ViewTable,
  ModifyViewData, AppMenuItem, AppMenuOption, MenuSeparator, AppMenuHeader,
  ModuleMenuItem, ModuleMenuApp, ModuleMenuHeader,
  MaxType, DomainMaxType, NumericMaxType, DomainModifyMaxType,
  TableType, ViewType, StorageType, MaxvarType, SearchType, SqlTarget,
  ScriptContext, PropertyMaxType, PropertyScope, PropertySecureLevel,
  PropertyValueRules, PropertyAccessType, MenuType, MenuPosition, TabDisplay,
} from './types';

let idCounter = 0;
function nextId(): string {
  return String(++idCounter);
}

function getAttr(el: Element, name: string): string | undefined {
  const val = el.getAttribute(name);
  return val !== null ? val : undefined;
}

function getRequiredAttr(el: Element, name: string): string {
  return el.getAttribute(name) || '';
}

function getBoolAttr(el: Element, name: string): boolean | undefined {
  const val = el.getAttribute(name);
  if (val === null) return undefined;
  return val === 'true';
}

function getNumAttr(el: Element, name: string): number | undefined {
  const val = el.getAttribute(name);
  if (val === null) return undefined;
  return Number(val);
}

function getTextContent(parent: Element, tag: string): string | undefined {
  const el = parent.getElementsByTagName(tag)[0];
  return el ? (el.textContent || '') : undefined;
}

function getChildElements(parent: Element, tag: string): Element[] {
  return Array.from(parent.getElementsByTagName(tag)).filter(
    (el) => el.parentElement === parent
  );
}

function parseAttrDef(el: Element): AttrDef {
  return {
    attribute: getRequiredAttr(el, 'attribute'),
    maxtype: getAttr(el, 'maxtype') as MaxType | undefined,
    length: getNumAttr(el, 'length'),
    persistent: getBoolAttr(el, 'persistent'),
    haslongdesc: getBoolAttr(el, 'haslongdesc'),
    required: getBoolAttr(el, 'required'),
    userdefined: getBoolAttr(el, 'userdefined'),
    domain: getAttr(el, 'domain'),
    classname: getAttr(el, 'classname'),
    defaultvalue: getAttr(el, 'defaultvalue'),
    title: getRequiredAttr(el, 'title'),
    remarks: getRequiredAttr(el, 'remarks'),
    sameasobject: getAttr(el, 'sameasobject'),
    sameasattribute: getAttr(el, 'sameasattribute'),
    mustbe: getBoolAttr(el, 'mustbe'),
    ispositive: getBoolAttr(el, 'ispositive'),
    scale: getNumAttr(el, 'scale'),
    autokey: getAttr(el, 'autokey'),
    canautonum: getBoolAttr(el, 'canautonum'),
    searchtype: getAttr(el, 'searchtype') as SearchType | undefined,
    localizable: getBoolAttr(el, 'localizable'),
    domainlink: getAttr(el, 'domainlink'),
    restricted: getBoolAttr(el, 'restricted'),
  };
}

function parseIndexKeys(parent: Element): IndexKey[] {
  return getChildElements(parent, 'indexkey').map((el) => ({
    column: getRequiredAttr(el, 'column'),
    ascending: getBoolAttr(el, 'ascending'),
  }));
}

function parseSynonymValues(parent: Element): SynonymValueInfo[] {
  return getChildElements(parent, 'synonymvalueinfo').map((el) => ({
    value: getRequiredAttr(el, 'value'),
    maxvalue: getRequiredAttr(el, 'maxvalue'),
    defaults: getBoolAttr(el, 'defaults') ?? false,
    description: getAttr(el, 'description'),
  }));
}

function parseColumnValues(parent: Element): ColumnValue[] {
  return getChildElements(parent, 'columnvalue').map((el) => ({
    column: getRequiredAttr(el, 'column'),
    string: getAttr(el, 'string'),
    fromcolumn: getAttr(el, 'fromcolumn'),
    boolean: getBoolAttr(el, 'boolean'),
    number: getAttr(el, 'number'),
  }));
}

function parseAppMenuItems(parent: Element): AppMenuItem[] {
  const items: AppMenuItem[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.tagName === 'app_menu_option') {
      items.push({
        type: 'option',
        option: getRequiredAttr(child, 'option'),
        image: getAttr(child, 'image'),
        accesskey: getAttr(child, 'accesskey'),
        tabdisplay: getRequiredAttr(child, 'tabdisplay') as TabDisplay,
      } as AppMenuOption);
    } else if (child.tagName === 'menu_separator') {
      items.push({
        type: 'separator',
        tabdisplay: getAttr(child, 'tabdisplay') as TabDisplay | undefined,
      } as MenuSeparator);
    } else if (child.tagName === 'app_menu_header') {
      items.push({
        type: 'header',
        headerdescription: getRequiredAttr(child, 'headerdescription'),
        image: getAttr(child, 'image'),
        tabdisplay: getAttr(child, 'tabdisplay') as TabDisplay | undefined,
        items: parseAppMenuItems(child) as (AppMenuOption | MenuSeparator)[],
      } as AppMenuHeader);
    }
  }
  return items;
}

function parseModuleMenuItems(parent: Element): ModuleMenuItem[] {
  const items: ModuleMenuItem[] = [];
  for (const child of Array.from(parent.children)) {
    if (child.tagName === 'module_menu_app') {
      items.push({
        type: 'app',
        app: getRequiredAttr(child, 'app'),
        image: getAttr(child, 'image'),
      } as ModuleMenuApp);
    } else if (child.tagName === 'module_menu_header') {
      items.push({
        type: 'header',
        headerdescription: getRequiredAttr(child, 'headerdescription'),
        apps: getChildElements(child, 'module_menu_app').map((a) => ({
          type: 'app' as const,
          app: getRequiredAttr(a, 'app'),
          image: getAttr(a, 'image'),
        })),
      } as ModuleMenuHeader);
    }
  }
  return items;
}

function parseOperation(el: Element): DbcOperation | null {
  const tag = el.tagName;
  switch (tag) {
    case 'define_table':
      return {
        type: 'define_table',
        object: getRequiredAttr(el, 'object'),
        description: getRequiredAttr(el, 'description'),
        service: getRequiredAttr(el, 'service'),
        classname: getRequiredAttr(el, 'classname'),
        persistent: getBoolAttr(el, 'persistent'),
        tableType: getRequiredAttr(el, 'type') as TableType,
        primarykey: getAttr(el, 'primarykey'),
        mainobject: getBoolAttr(el, 'mainobject'),
        internal: getBoolAttr(el, 'internal'),
        trigroot: getAttr(el, 'trigroot'),
        storagetype: getAttr(el, 'storagetype') as StorageType | undefined,
        attributes: getChildElements(el, 'attrdef').map(parseAttrDef),
      };
    case 'modify_table':
      return {
        type: 'modify_table',
        name: getRequiredAttr(el, 'name'),
        object: getAttr(el, 'object'),
        description: getAttr(el, 'description'),
        service: getAttr(el, 'service'),
        classname: getAttr(el, 'classname'),
        tableType: getAttr(el, 'type') as TableType | undefined,
        primarykey: getAttr(el, 'primarykey'),
        mainobject: getBoolAttr(el, 'mainobject'),
        internal: getBoolAttr(el, 'internal'),
        trigroot: getAttr(el, 'trigroot'),
        unique_column: getAttr(el, 'unique_column'),
        storagetype: getAttr(el, 'storagetype') as StorageType | undefined,
      };
    case 'drop_table':
      return { type: 'drop_table', object: getRequiredAttr(el, 'object') };
    case 'add_attributes':
      return {
        type: 'add_attributes',
        object: getRequiredAttr(el, 'object'),
        attributes: getChildElements(el, 'attrdef').map(parseAttrDef),
      };
    case 'modify_attribute':
      return {
        type: 'modify_attribute',
        object: getRequiredAttr(el, 'object'),
        attribute: getRequiredAttr(el, 'attribute'),
        maxtype: getAttr(el, 'maxtype') as MaxType | undefined,
        length: getNumAttr(el, 'length'),
        persistent: getBoolAttr(el, 'persistent'),
        haslongdesc: getBoolAttr(el, 'haslongdesc'),
        required: getBoolAttr(el, 'required'),
        userdefined: getBoolAttr(el, 'userdefined'),
        domain: getAttr(el, 'domain'),
        classname: getAttr(el, 'classname'),
        defaultvalue: getAttr(el, 'defaultvalue'),
        title: getAttr(el, 'title'),
        remarks: getAttr(el, 'remarks'),
        sameasobject: getAttr(el, 'sameasobject'),
        sameasattribute: getAttr(el, 'sameasattribute'),
        mustbe: getBoolAttr(el, 'mustbe'),
        ispositive: getBoolAttr(el, 'ispositive'),
        scale: getNumAttr(el, 'scale'),
        autokey: getAttr(el, 'autokey'),
        canautonum: getBoolAttr(el, 'canautonum'),
        searchtype: getAttr(el, 'searchtype') as SearchType | undefined,
        localizable: getBoolAttr(el, 'localizable'),
        domainlink: getAttr(el, 'domainlink'),
        restricted: getBoolAttr(el, 'restricted'),
        excludetenants: getAttr(el, 'excludetenants'),
      };
    case 'drop_attributes':
      return {
        type: 'drop_attributes',
        object: getRequiredAttr(el, 'object'),
        attributes: getChildElements(el, 'attrname').map((a) => ({
          name: getRequiredAttr(a, 'name'),
        })) as AttrName[],
      };
    case 'create_relationship':
      return {
        type: 'create_relationship',
        parent: getRequiredAttr(el, 'parent'),
        name: getRequiredAttr(el, 'name'),
        child: getRequiredAttr(el, 'child'),
        whereclause: getRequiredAttr(el, 'whereclause'),
        remarks: getRequiredAttr(el, 'remarks'),
      };
    case 'modify_relationship':
      return {
        type: 'modify_relationship',
        parent: getRequiredAttr(el, 'parent'),
        name: getRequiredAttr(el, 'name'),
        child: getAttr(el, 'child'),
        whereclause: getAttr(el, 'whereclause'),
        remarks: getAttr(el, 'remarks'),
      };
    case 'drop_relationship':
      return {
        type: 'drop_relationship',
        parent: getRequiredAttr(el, 'parent'),
        name: getRequiredAttr(el, 'name'),
      };
    case 'specify_synonym_domain':
      return {
        type: 'specify_synonym_domain',
        domainid: getRequiredAttr(el, 'domainid'),
        description: getAttr(el, 'description'),
        maxtype: getAttr(el, 'maxtype') as DomainMaxType | undefined,
        length: getNumAttr(el, 'length'),
        overwrite: getBoolAttr(el, 'overwrite'),
        internal: getBoolAttr(el, 'internal'),
        values: parseSynonymValues(el),
      };
    case 'add_synonyms':
      return {
        type: 'add_synonyms',
        domainid: getRequiredAttr(el, 'domainid'),
        values: parseSynonymValues(el),
      };
    case 'specify_aln_domain':
      return {
        type: 'specify_aln_domain',
        domainid: getRequiredAttr(el, 'domainid'),
        description: getAttr(el, 'description'),
        maxtype: getAttr(el, 'maxtype') as DomainMaxType | undefined,
        length: getNumAttr(el, 'length'),
        overwrite: getBoolAttr(el, 'overwrite'),
        internal: getBoolAttr(el, 'internal'),
        values: getChildElements(el, 'alnvalueinfo').map((v) => ({
          value: getRequiredAttr(v, 'value'),
          description: getAttr(v, 'description'),
        })) as AlnValueInfo[],
      };
    case 'specify_numeric_domain':
      return {
        type: 'specify_numeric_domain',
        domainid: getRequiredAttr(el, 'domainid'),
        description: getAttr(el, 'description'),
        maxtype: getAttr(el, 'maxtype') as NumericMaxType | undefined,
        length: getNumAttr(el, 'length'),
        scale: getNumAttr(el, 'scale'),
        overwrite: getBoolAttr(el, 'overwrite'),
        internal: getBoolAttr(el, 'internal'),
        values: getChildElements(el, 'numericvalueinfo').map((v) => ({
          value: getRequiredAttr(v, 'value'),
          description: getAttr(v, 'description'),
        })) as NumericValueInfo[],
      };
    case 'specify_crossover_domain':
      return {
        type: 'specify_crossover_domain',
        domainid: getRequiredAttr(el, 'domainid'),
        description: getAttr(el, 'description'),
        overwrite: getBoolAttr(el, 'overwrite'),
        validationwhereclause: getRequiredAttr(el, 'validationwhereclause'),
        listwhereclause: getAttr(el, 'listwhereclause'),
        errorbundle: getAttr(el, 'errorbundle'),
        errorkey: getAttr(el, 'errorkey'),
        objectname: getRequiredAttr(el, 'objectname'),
        internal: getBoolAttr(el, 'internal'),
        values: getChildElements(el, 'crossovervalueinfo').map((v) => ({
          sourcefield: getRequiredAttr(v, 'sourcefield'),
          destfield: getAttr(v, 'destfield'),
          copyifnull: getBoolAttr(v, 'copyifnull'),
          copyevenifsrcnull: getBoolAttr(v, 'copyevenifsrcnull'),
          copyonlyifdestnull: getBoolAttr(v, 'copyonlyifdestnull'),
        })) as CrossoverValueInfo[],
      };
    case 'specify_table_domain':
      return {
        type: 'specify_table_domain',
        domainid: getRequiredAttr(el, 'domainid'),
        description: getAttr(el, 'description'),
        overwrite: getBoolAttr(el, 'overwrite'),
        validationwhereclause: getRequiredAttr(el, 'validationwhereclause'),
        listwhereclause: getAttr(el, 'listwhereclause'),
        errorbundle: getAttr(el, 'errorbundle'),
        errorkey: getAttr(el, 'errorkey'),
        objectname: getRequiredAttr(el, 'objectname'),
        internal: getBoolAttr(el, 'internal'),
      };
    case 'modify_domain_type':
      return {
        type: 'modify_domain_type',
        domain: getRequiredAttr(el, 'domain'),
        maxtype: getAttr(el, 'maxtype') as DomainModifyMaxType | undefined,
        length: getNumAttr(el, 'length'),
        scale: getNumAttr(el, 'scale'),
      };
    case 'drop_domain':
      return { type: 'drop_domain', domainid: getRequiredAttr(el, 'domainid') };
    case 'specify_index':
      return {
        type: 'specify_index',
        name: getAttr(el, 'name'),
        object: getRequiredAttr(el, 'object'),
        primary: getBoolAttr(el, 'primary'),
        unique: getBoolAttr(el, 'unique'),
        clustered: getBoolAttr(el, 'clustered'),
        required: getBoolAttr(el, 'required'),
        addtenantid: getBoolAttr(el, 'addtenantid'),
        keys: parseIndexKeys(el),
      };
    case 'drop_index': {
      const keys = parseIndexKeys(el);
      return {
        type: 'drop_index',
        name: getAttr(el, 'name'),
        object: getRequiredAttr(el, 'object'),
        keys: keys.length > 0 ? keys : undefined,
      };
    }
    case 'create_app':
      return {
        type: 'create_app',
        app: getRequiredAttr(el, 'app'),
        description: getRequiredAttr(el, 'description'),
        restrictions: getAttr(el, 'restrictions'),
        orderby: getAttr(el, 'orderby'),
        maintbname: getAttr(el, 'maintbname'),
      };
    case 'modify_app':
      return {
        type: 'modify_app',
        app: getRequiredAttr(el, 'app'),
        description: getAttr(el, 'description'),
        restrictions: getAttr(el, 'restrictions'),
        orderby: getAttr(el, 'orderby'),
        maintbname: getAttr(el, 'maintbname'),
      };
    case 'drop_app':
      return { type: 'drop_app', app: getRequiredAttr(el, 'app') };
    case 'create_app_menu':
      return {
        type: 'create_app_menu',
        app: getRequiredAttr(el, 'app'),
        menuType: getAttr(el, 'type') as MenuType | undefined,
        items: parseAppMenuItems(el),
      };
    case 'additional_app_menu':
      return {
        type: 'additional_app_menu',
        app: getRequiredAttr(el, 'app'),
        menuType: getAttr(el, 'type') as MenuType | undefined,
        menu_position: getAttr(el, 'menu_position') as MenuPosition | undefined,
        pos_param: getAttr(el, 'pos_param'),
        items: parseAppMenuItems(el),
      };
    case 'add_sigoption':
      return {
        type: 'add_sigoption',
        app: getRequiredAttr(el, 'app'),
        optionname: getRequiredAttr(el, 'optionname'),
        description: getRequiredAttr(el, 'description'),
        esigenabled: getBoolAttr(el, 'esigenabled'),
        visible: getBoolAttr(el, 'visible'),
        alsogrants: getAttr(el, 'alsogrants'),
        alsorevokes: getAttr(el, 'alsorevokes'),
        prerequisite: getAttr(el, 'prerequisite'),
        langcode: getAttr(el, 'langcode'),
        grantapp: getAttr(el, 'grantapp'),
        grantoption: getAttr(el, 'grantoption'),
        granteveryone: getBoolAttr(el, 'granteveryone'),
        grantcondition: getAttr(el, 'grantcondition'),
      };
    case 'drop_sigoption':
      return {
        type: 'drop_sigoption',
        app: getRequiredAttr(el, 'app'),
        optionname: getRequiredAttr(el, 'optionname'),
      };
    case 'create_module':
      return {
        type: 'create_module',
        module: getRequiredAttr(el, 'module'),
        description: getRequiredAttr(el, 'description'),
        menu_position: getAttr(el, 'menu_position') as MenuPosition | undefined,
        menu_param: getAttr(el, 'menu_param'),
        image: getAttr(el, 'image'),
        items: parseModuleMenuItems(el),
      };
    case 'modify_module':
      return {
        type: 'modify_module',
        module: getRequiredAttr(el, 'module'),
        description: getAttr(el, 'description'),
        menu_position: getAttr(el, 'menu_position') as MenuPosition | undefined,
        menu_pos_param: getAttr(el, 'menu_pos_param'),
        image: getAttr(el, 'image'),
      };
    case 'drop_module':
      return { type: 'drop_module', module: getRequiredAttr(el, 'module') };
    case 'module_app':
      return {
        type: 'module_app',
        module: getRequiredAttr(el, 'module'),
        app: getRequiredAttr(el, 'app'),
        menu_position: getAttr(el, 'menu_position') as MenuPosition | undefined,
        menu_pos_param: getAttr(el, 'menu_pos_param'),
        image: getAttr(el, 'image'),
      };
    case 'define_view': {
      const hasAutoselect = el.getElementsByTagName('autoselect').length > 0;
      const tables = getChildElements(el, 'table').map((t) => ({
        name: getRequiredAttr(t, 'name'),
      })) as ViewTable[];
      const columns = getChildElements(el, 'view_column').map((c) => ({
        table: getRequiredAttr(c, 'table'),
        column: getRequiredAttr(c, 'column'),
        view_column: getRequiredAttr(c, 'view_column'),
        same_storage_as: getAttr(c, 'same_storage_as'),
      })) as ViewColumn[];
      return {
        type: 'define_view',
        name: getRequiredAttr(el, 'name'),
        description: getRequiredAttr(el, 'description'),
        service: getRequiredAttr(el, 'service'),
        classname: getRequiredAttr(el, 'classname'),
        extends: getAttr(el, 'extends'),
        viewType: getRequiredAttr(el, 'type') as ViewType,
        mainobject: getBoolAttr(el, 'mainobject'),
        internal: getBoolAttr(el, 'internal'),
        mode: hasAutoselect ? 'autoselect' : 'custom',
        tables: tables.length > 0 ? tables : undefined,
        columns: columns.length > 0 ? columns : undefined,
        view_select: getTextContent(el, 'view_select'),
        view_from: getTextContent(el, 'view_from'),
        view_where: getTextContent(el, 'view_where') || '',
      };
    }
    case 'modify_view':
      return {
        type: 'modify_view',
        name: getRequiredAttr(el, 'name'),
        classname: getAttr(el, 'classname'),
        description: getAttr(el, 'description'),
        mainobject: getBoolAttr(el, 'mainobject'),
        internal: getBoolAttr(el, 'internal'),
        service: getAttr(el, 'service'),
        viewType: getAttr(el, 'type') as ViewType | undefined,
        view_select: getTextContent(el, 'view_select'),
        view_from: getTextContent(el, 'view_from'),
        view_where: getTextContent(el, 'view_where'),
      };
    case 'drop_view':
      return { type: 'drop_view', name: getRequiredAttr(el, 'name') };
    case 'add_view_attribute':
      return {
        type: 'add_view_attribute',
        view: getRequiredAttr(el, 'view'),
        view_column: getRequiredAttr(el, 'view_column'),
        table: getRequiredAttr(el, 'table'),
        column: getRequiredAttr(el, 'column'),
        same_storage_as: getAttr(el, 'same_storage_as'),
      };
    case 'drop_view_attribute':
      return {
        type: 'drop_view_attribute',
        view: getRequiredAttr(el, 'view'),
        attribute: getRequiredAttr(el, 'attribute'),
      };
    case 'modify_view_attributes':
      return {
        type: 'modify_view_attributes',
        view: getRequiredAttr(el, 'view'),
        modifications: getChildElements(el, 'modify_view_data').map((m) => ({
          view_column: getRequiredAttr(m, 'view_column'),
          new_name: getAttr(m, 'new_name'),
          table: getAttr(m, 'table'),
          column: getAttr(m, 'column'),
          same_storage_as: getAttr(m, 'same_storage_as'),
        })) as ModifyViewData[],
      };
    case 'add_service':
      return {
        type: 'add_service',
        servicename: getRequiredAttr(el, 'servicename'),
        description: getRequiredAttr(el, 'description'),
        classname: getRequiredAttr(el, 'classname'),
        singleton: getBoolAttr(el, 'singleton'),
      };
    case 'modify_service':
      return {
        type: 'modify_service',
        servicename: getRequiredAttr(el, 'servicename'),
        description: getAttr(el, 'description'),
        classname: getAttr(el, 'classname'),
        singleton: getBoolAttr(el, 'singleton'),
      };
    case 'drop_service':
      return { type: 'drop_service', servicename: getRequiredAttr(el, 'servicename') };
    case 'add_property':
      return {
        type: 'add_property',
        name: getRequiredAttr(el, 'name'),
        description: getRequiredAttr(el, 'description'),
        maxtype: getRequiredAttr(el, 'maxtype') as PropertyMaxType,
        domainid: getAttr(el, 'domainid'),
        scope: getAttr(el, 'scope') as PropertyScope | undefined,
        secure_level: getRequiredAttr(el, 'secure_level') as PropertySecureLevel,
        live_refresh: getBoolAttr(el, 'live_refresh'),
        required: getBoolAttr(el, 'required'),
        online_changes: getBoolAttr(el, 'online_changes'),
        user_defined: getBoolAttr(el, 'user_defined'),
        default_value: getAttr(el, 'default_value'),
        encrypted: getBoolAttr(el, 'encrypted'),
        masked: getBoolAttr(el, 'masked'),
        value: getAttr(el, 'value'),
        valuerules: getAttr(el, 'valuerules') as PropertyValueRules | undefined,
        accesstype: getAttr(el, 'accesstype') as PropertyAccessType | undefined,
      };
    case 'set_property':
      return {
        type: 'set_property',
        name: getRequiredAttr(el, 'name'),
        value: getRequiredAttr(el, 'value'),
      };
    case 'drop_property':
      return { type: 'drop_property', name: getRequiredAttr(el, 'name') };
    case 'create_maxvar':
      return {
        type: 'create_maxvar',
        name: getRequiredAttr(el, 'name'),
        description: getRequiredAttr(el, 'description'),
        default: getAttr(el, 'default'),
        maxvarType: getRequiredAttr(el, 'type') as MaxvarType,
      };
    case 'modify_maxvar':
      return {
        type: 'modify_maxvar',
        name: getRequiredAttr(el, 'name'),
        description: getAttr(el, 'description'),
        default: getAttr(el, 'default'),
        maxvarType: getAttr(el, 'type') as MaxvarType | undefined,
      };
    case 'drop_maxvar':
      return { type: 'drop_maxvar', name: getRequiredAttr(el, 'name') };
    case 'insert':
      return {
        type: 'insert',
        table: getRequiredAttr(el, 'table'),
        selectfrom: getAttr(el, 'selectfrom'),
        selectwhere: getAttr(el, 'selectwhere'),
        ignore_duplicates: getBoolAttr(el, 'ignore_duplicates'),
        rows: getChildElements(el, 'insertrow').map((row) => ({
          columns: parseColumnValues(row),
        })) as InsertRow[],
      };
    case 'freeform':
      return {
        type: 'freeform',
        description: getRequiredAttr(el, 'description'),
        statements: getChildElements(el, 'sql').map((s) => ({
          target: (getAttr(s, 'target') || 'all') as SqlTarget,
          sql: s.textContent || '',
        })) as SqlStatement[],
      };
    default:
      return null;
  }
}

export function parseDbcXml(xmlString: string): DbcBuilderState {
  idCounter = 0;
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const scriptEl = doc.getElementsByTagName('script')[0];

  if (!scriptEl) {
    return {
      script: { author: '', scriptname: '' },
      checks: [],
      operations: [],
      selectedId: null,
    };
  }

  const config: DbcScriptConfig = {
    author: getRequiredAttr(scriptEl, 'author'),
    scriptname: getRequiredAttr(scriptEl, 'scriptname'),
  };

  const descEl = scriptEl.getElementsByTagName('description')[0];
  if (descEl && descEl.parentElement === scriptEl) {
    config.description = descEl.textContent || undefined;
  }

  if (scriptEl.hasAttribute('for_demo_only')) {
    config.for_demo_only = getBoolAttr(scriptEl, 'for_demo_only');
  }
  if (scriptEl.hasAttribute('context')) {
    config.context = getAttr(scriptEl, 'context') as ScriptContext;
  }
  if (scriptEl.hasAttribute('tenantcode')) {
    config.tenantcode = getAttr(scriptEl, 'tenantcode');
  }

  // Parse checks
  const checks: DbcCheck[] = [];
  const checkEls = getChildElements(scriptEl, 'check');
  for (const checkEl of checkEls) {
    const check: DbcCheck = {
      queries: getChildElements(checkEl, 'check_query').map((q) => ({
        query: getRequiredAttr(q, 'query'),
      })) as DbcCheckQuery[],
    };
    if (checkEl.hasAttribute('tag')) check.tag = getAttr(checkEl, 'tag');
    if (checkEl.hasAttribute('group')) check.group = getAttr(checkEl, 'group');
    if (checkEl.hasAttribute('key')) check.key = getAttr(checkEl, 'key');
    if (checkEl.hasAttribute('default')) check.default = getAttr(checkEl, 'default');
    if (checkEl.hasAttribute('skip_script')) check.skip_script = getBoolAttr(checkEl, 'skip_script');
    checks.push(check);
  }

  // Parse operations from statements
  const operations: DbcOperationEntry[] = [];
  const statementsEl = scriptEl.getElementsByTagName('statements')[0];
  if (statementsEl) {
    for (const child of Array.from(statementsEl.children)) {
      const op = parseOperation(child);
      if (op) {
        operations.push({ id: nextId(), operation: op });
      }
    }
  }

  return {
    script: config,
    checks,
    operations,
    selectedId: null,
  };
}
