import { format as formatUrl } from 'url';

import supertestAsPromised from 'supertest-as-promised';

/**
 * Supertest provider that doesn't include user credentials into base URL that is passed
 * to the supertest. It's used to test API behaviour for not yet authenticated user.
 */
export function SupertestWithoutAuthProvider({ getService }) {
  const config = getService('config');
  const kibanaServerConfig = config.get('servers.kibana');

  return supertestAsPromised(formatUrl({
    ...kibanaServerConfig,
    auth: false
  }));
}
