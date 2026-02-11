import type { DefineTableOp, TableType, StorageType } from '@/lib/dbc/types';
import type { OslcMaxObject, OslcMaxAttribute } from '../types';
import { mapAttributeToAttrDef } from './attribute-mapper';

/**
 * Map an OSLC object + its attributes to a DefineTableOp
 */
export function mapObjectToDefineTable(
  obj: OslcMaxObject,
  attrs: OslcMaxAttribute[]
): DefineTableOp {
  return {
    type: 'define_table',
    object: obj.objectname,
    description: obj.description ?? '',
    classname: obj.classname ?? '',
    service: obj.servicename ?? '',
    tableType: (obj.type as TableType) ?? 'system',
    persistent: obj.persistent,
    primarykey: obj.primarykey,
    internal: obj.internal,
    storagetype: obj.storagetype as StorageType | undefined,
    attributes: attrs.map(mapAttributeToAttrDef),
  };
}
