import { stub } from 'sinon';

export function serverFixture() {
  return {
    auth: {
      test: stub()
    },
    plugins: {
      xpack_main: {
        info: {
          isAvailable: stub()
        }
      }
    },
    config() {
      return {
        get: stub()
      };
    }
  };
}