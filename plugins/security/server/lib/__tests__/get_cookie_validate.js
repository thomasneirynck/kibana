import expect from 'expect.js';
import sinon from 'sinon';
import { AuthScopeService } from '../auth_scope_service';
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

    function createServerMock() {
      return {
        config() {
          return {
            get: sinon.stub().withArgs('xpack.security.sessionTimeout').returns(100)
          };
        },

        plugins: {
          kibana: {
            systemApi: {
              isSystemApiRequest() {
                return false;
              }
            }
          },

          security: {
            async getUser() {
              return {};
            }
          }
        }
      };
    }

    function createRequestMock() {
      return {
        headers: {},
        cookieAuth: {
          set: sinon.stub()
        },
      };
    }

    beforeEach(() => sandbox.useFakeTimers());
    afterEach(() => sandbox.restore());

    it('should provide proper credentials object and set correct cookie.', async function () {
      const username = 'username';
      const password = 'password';
      const serverMock = createServerMock();
      const requestMock = createRequestMock();
      const authScope = new AuthScopeService();

      // Setup value that will be used to calculate cookie expiration time.
      sandbox.clock.tick(1000);
      sandbox.spy(authScope, 'getForRequestAndUser');

      const callback = sinon.stub();
      await getCookieValidate(serverMock, authScope)(requestMock, { username, password }, callback);

      sinon.assert.calledWithExactly(requestMock.cookieAuth.set, {
        username,
        password,
        expires: 1100
      });

      sinon.assert.calledOnce(authScope.getForRequestAndUser);
      sinon.assert.calledWithExactly(authScope.getForRequestAndUser, requestMock, {});
      sinon.assert.calledWithExactly(callback, null, true, { username, scope: [] });
    });
  });
});
