import type { CreateAppOp } from '@/lib/dbc/types';
import type { OslcMaxApp } from '../types';

/**
 * Map an OSLC application to a CreateAppOp
 */
export function mapAppToDbcOp(app: OslcMaxApp): CreateAppOp {
  return {
    type: 'create_app',
    app: app.app,
    description: app.description ?? '',
    maintbname: app.maintbname,
    restrictions: app.restrictions,
    orderby: app.orderby,
  };
}
