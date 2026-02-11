import type { CreateRelationshipOp } from '@/lib/dbc/types';
import type { OslcMaxRelationship } from '../types';

/**
 * Map an OSLC relationship to a CreateRelationshipOp
 */
export function mapRelationshipToDbcOp(rel: OslcMaxRelationship): CreateRelationshipOp {
  return {
    type: 'create_relationship',
    parent: rel.parent,
    name: rel.name,
    child: rel.child,
    whereclause: rel.whereclause ?? '',
    remarks: rel.remarks ?? '',
  };
}
