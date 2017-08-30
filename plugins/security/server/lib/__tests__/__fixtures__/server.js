import { stub } from 'sinon';

export function serverFixture() {
  return {
    config: stub(),
    register: stub(),
    expose: stub(),
    log: stub(),
    route: stub(),

    auth: {
      strategy: stub(),
      test: stub()
    },

    plugins: {
      elasticsearch: {
        createCluster: stub()
      },

      kibana: {
        systemApi: { isSystemApiRequest: stub() }
      },

      security: {
        getUser: stub(),
        authenticate: stub(),
        deauthenticate: stub()
      },

      xpack_main: {
        info: {
          isAvailable: stub()
        }
      }
    }
  };
}

