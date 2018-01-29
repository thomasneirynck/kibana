import { resolveKibanaPath } from '@elastic/plugin-helpers/lib/index';

export default async function ({ readConfigFile }) {
  // Read the Kibana API integration tests config file so that we can utilize its services.
  const kibanaAPITestsConfig = await readConfigFile(resolveKibanaPath('test/api_integration/config.js'));
  const xPackAPITestsConfig = await readConfigFile(require.resolve('../api_integration/config.js'));

  return {
    testFiles: [require.resolve('./apis')],
    servers: xPackAPITestsConfig.get('servers'),
    services: {
      chance: kibanaAPITestsConfig.get('services.chance'),
      supertestWithoutAuth: xPackAPITestsConfig.get('services.supertestWithoutAuth'),
    },
    junit: {
      reportName: 'X-Pack SAML API Integration Tests',
    },
  };
}
