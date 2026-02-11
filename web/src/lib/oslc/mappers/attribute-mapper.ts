import type { AttrDef, AddAttributesOp, MaxType, SearchType } from '@/lib/dbc/types';
import type { OslcMaxAttribute } from '../types';

/**
 * Map a single OSLC attribute to a DBC AttrDef
 */
export function mapAttributeToAttrDef(attr: OslcMaxAttribute): AttrDef {
  return {
    attribute: attr.attributename,
    maxtype: attr.maxtype as MaxType | undefined,
    length: attr.length,
    scale: attr.scale,
    domain: attr.domainid,
    required: attr.required,
    persistent: attr.persistent,
    haslongdesc: attr.haslongdesc,
    userdefined: attr.userdefined,
    classname: attr.classname,
    defaultvalue: attr.defaultvalue,
    title: attr.title ?? '',
    remarks: attr.remarks ?? '',
    sameasobject: attr.sameasobject,
    sameasattribute: attr.sameasattribute,
    mustbe: attr.mustbe,
    ispositive: attr.ispositive,
    autokey: attr.autokey,
    canautonum: attr.canautonum,
    searchtype: attr.searchtype as SearchType | undefined,
    localizable: attr.localizable,
    domainlink: attr.domainlink,
    restricted: attr.restricted,
  };
}

/**
 * Map multiple OSLC attributes into an AddAttributesOp
 */
export function mapAttributesToAddAttributesOp(
  objectName: string,
  attrs: OslcMaxAttribute[]
): AddAttributesOp {
  return {
    type: 'add_attributes',
    object: objectName,
    attributes: attrs.map(mapAttributeToAttrDef),
  };
}
