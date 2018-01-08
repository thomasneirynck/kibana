import { resolveKibanaPath } from '@elastic/plugin-helpers';
import { SupertestWithoutAuthProvider } from './services';

export default async function ({ readConfigFile }) {

  // Read the Kibana API integration tests config file so that we can utilize its services.
  const kibanaAPITestsConfig = await readConfigFile(resolveKibanaPath('test/api_integration/config.js'));
  const xPackFunctionalTestsConfig = await readConfigFile(require.resolve('../functional/config.js'));

  return {
    testFiles: [
      require.resolve('./apis/index'),
    ],
    servers: xPackFunctionalTestsConfig.get('servers'),
    services: {
      supertest: kibanaAPITestsConfig.get('services.supertest'),
      supertestWithoutAuth: SupertestWithoutAuthProvider
    },
    junit: {
      reportName: 'X-Pack API Integration Tests',
    },
  };
}
