import expect from 'expect.js';
import sinon from 'sinon';
import { getCookieValidate, hasSessionExpired } from '../get_cookie_validate';

describe('Cookie validate', function () {
  describe('hasSessionExpired', () => {
    it('should return true if the expiry is before now', function () {
      const expires = new Date(Date.now() - 1000);
      const session = { expires };
      expect(hasSessionExpired(session)).to.equal(true);
    });

    it('should return false if the expiry is after now', function () {
      const expires = new Date(Date.now() + 1000);
      const session = { expires };
      expect(hasSessionExpired(session)).to.equal(false);
    });

    it('should return false if there is no expiry', function () {
      const session = {};
      expect(hasSessionExpired(session)).to.equal(false);
    });
  });

  describe('getCookieValidate', () => {
    const sandbox = sinon.sandbox.create();
    const configMock = { get() {} };
    const serverMock = {
      config() {
        return configMock;
      },

      plugins: {
        kibana: {
          systemApi: { isSystemApiRequest() {} }
        },

        security: {
          getUser() {}
        }
      }
    };

    let requestMock;
    beforeEach(() => {
      requestMock = {
        headers: {},
        cookieAuth: {
          set() {}
        }
      };

      sandbox.useFakeTimers();

      sandbox.stub(serverMock.plugins.kibana.systemApi, 'isSystemApiRequest');
      sandbox.stub(serverMock.plugins.security, 'getUser');
      sandbox.stub(requestMock.cookieAuth, 'set');
      sandbox.stub(configMock, 'get');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should provide proper credentials object and set correct cookie.', async function () {
      const username = 'username';
      const password = 'password';
      const isDashboardOnlyMode = false;

      serverMock.plugins.kibana.systemApi.isSystemApiRequest.returns(false);
      serverMock.plugins.security.getUser.withArgs(requestMock).returns(
        Promise.resolve({ isDashboardOnlyMode })
      );

      // Setup value that will be used to calculate cookie expiration time.
      configMock.get.withArgs('xpack.security.sessionTimeout').returns(100);
      sandbox.clock.tick(1000);

      const callback = sinon.stub();
      await getCookieValidate(serverMock)(requestMock, { username, password }, callback);

      sinon.assert.calledWithExactly(requestMock.cookieAuth.set, {
        username,
        password,
        expires: 1100
      });
      sinon.assert.calledWithExactly(callback, null, true, { username, isDashboardOnlyMode });
    });
  });
});
