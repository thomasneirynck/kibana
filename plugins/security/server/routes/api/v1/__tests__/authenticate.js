import expect from 'expect.js';
import Joi from 'joi';
import sinon from 'sinon';

import { serverFixture } from '../../../../lib/__tests__/__fixtures__/server';
import { AuthenticationResult } from '../../../../../server/lib/authentication/authentication_result';
import { BasicCredentials } from '../../../../../server/lib/authentication/providers/basic';
import { initAuthenticateApi } from '../authenticate';

describe('Authentication routes', () => {
  let serverStub;
  let replyStub;

  beforeEach(() => {
    serverStub = serverFixture();
    replyStub = sinon.stub();
    replyStub.continue = sinon.stub();

    initAuthenticateApi(serverStub);
  });

  describe('login', () => {
    let loginRoute;
    let request;
    let authenticateStub;

    beforeEach(() => {
      loginRoute = serverStub.route
        .withArgs(sinon.match({ path: '/api/security/v1/login' }))
        .firstCall
        .args[0];

      request = {
        headers: {},
        payload: { username: 'user', password: 'password' }
      };

      authenticateStub = serverStub.plugins.security.authenticate.withArgs(
        sinon.match(BasicCredentials.decorateRequest({ headers: {} }, 'user', 'password'))
      );
    });

    it('correctly defines route.', async () => {
      expect(loginRoute.method).to.be('POST');
      expect(loginRoute.path).to.be('/api/security/v1/login');
      expect(loginRoute.handler).to.be.a(Function);
      expect(loginRoute.config).to.eql({
        auth: false,
        validate: {
          payload: {
            username: Joi.string().required(),
            password: Joi.string().required()
          }
        }
      });
    });

    it('returns 500 if authentication throws unhandled exception.', async () => {
      const unhandledException = new Error('Something went wrong.');
      authenticateStub.throws(unhandledException);

      await loginRoute.handler(request, replyStub);

      sinon.assert.notCalled(replyStub.continue);
      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub, sinon.match({
        isBoom: true,
        output: {
          payload: {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
          }
        }
      }));
    });

    it('returns 401 if authentication fails.', async () => {
      authenticateStub.returns(
        Promise.resolve(AuthenticationResult.failed(new Error('Something went wrong.')))
      );

      await loginRoute.handler(request, replyStub);

      sinon.assert.notCalled(replyStub.continue);
      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub, sinon.match({
        isBoom: true,
        output: {
          payload: {
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Error: Something went wrong.'
          }
        }
      }));
    });

    it('returns 401 if authentication is not handled.', async () => {
      authenticateStub.returns(
        Promise.resolve(AuthenticationResult.notHandled())
      );

      await loginRoute.handler(request, replyStub);

      sinon.assert.notCalled(replyStub.continue);
      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub, sinon.match({
        isBoom: true,
        output: {
          payload: {
            statusCode: 401,
            error: 'Unauthorized'
          }
        }
      }));
    });

    it('returns user data if authentication succeed.', async () => {
      const user = { username: 'user' };
      authenticateStub.returns(
        Promise.resolve(AuthenticationResult.succeeded(user))
      );

      await loginRoute.handler(request, replyStub);

      sinon.assert.notCalled(replyStub);
      sinon.assert.calledOnce(replyStub.continue);
      sinon.assert.calledWithExactly(replyStub.continue, { credentials: user });
    });
  });

  describe('logout', () => {
    let logoutRoute;

    beforeEach(() => {
      logoutRoute = serverStub.route
        .withArgs(sinon.match({ path: '/api/security/v1/logout' }))
        .firstCall
        .args[0];
    });

    it('correctly defines route.', async () => {
      expect(logoutRoute.method).to.be('POST');
      expect(logoutRoute.path).to.be('/api/security/v1/logout');
      expect(logoutRoute.handler).to.be.a(Function);
      expect(logoutRoute.config).to.eql({ auth: false });
    });

    it('returns 500 if deauthentication throws unhandled exception.', async () => {
      const request = {};
      const unhandledException = new Error('Something went wrong.');
      serverStub.plugins.security.deauthenticate
        .withArgs(sinon.match.same(request))
        .throws(unhandledException);

      await logoutRoute.handler(request, replyStub);

      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub, sinon.match({
        isBoom: true,
        output: {
          payload: {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An internal server error occurred'
          }
        }
      }));
    });

    it('returns 204 if deauthentication succeeds.', async () => {
      const replyResultStub = { code: sinon.stub() };
      replyStub.returns(replyResultStub);

      const request = {};
      await logoutRoute.handler(request, replyStub);

      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub);

      sinon.assert.calledOnce(replyResultStub.code);
      sinon.assert.calledWithExactly(replyResultStub.code, 204);
    });
  });

  describe('me', () => {
    let meRoute;

    beforeEach(() => {
      meRoute = serverStub.route
        .withArgs(sinon.match({ path: '/api/security/v1/me' }))
        .firstCall
        .args[0];
    });

    it('correctly defines route.', async () => {
      expect(meRoute.method).to.be('GET');
      expect(meRoute.path).to.be('/api/security/v1/me');
      expect(meRoute.handler).to.be.a(Function);
      expect(meRoute.config).to.be(undefined);
    });

    it('returns user from the authenticated request property.', async () => {
      const request = { auth: { credentials: { username: 'user' } } };
      await meRoute.handler(request, replyStub);

      sinon.assert.calledOnce(replyStub);
      sinon.assert.calledWithExactly(replyStub, { username: 'user' });
    });
  });
});
