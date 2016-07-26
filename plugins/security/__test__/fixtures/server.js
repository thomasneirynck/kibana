import { stub } from 'sinon';

export default () => {
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
};
