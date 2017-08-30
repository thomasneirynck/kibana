import expect from 'expect.js';
import sinon from 'sinon';

import { serverFixture } from '../../__tests__/__fixtures__/server';
import { Session } from '../session';
import { AuthScopeService } from '../../auth_scope_service';
import { initAuthenticator } from '../authenticator';

describe('Authenticator', () => {
  const sandbox = sinon.sandbox.create();

  let config;
  let server;
  let session;
  beforeEach(() => {
    server = serverFixture();
    session = sinon.createStubInstance(Session);

    config = { get: sinon.stub() };

    server.config.returns(config);
    server.register.yields();

    sandbox.stub(Session, 'create').withArgs(server).returns(Promise.resolve(session));
    sandbox.stub(AuthScopeService.prototype, 'getForRequestAndUser')
      .returns(Promise.resolve([]));

    sandbox.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('initialization', () => {
    it('fails if authentication providers are not configured.', async () => {
      config.get.withArgs('xpack.security.authProviders').returns([]);

      try {
        await initAuthenticator(server);
        expect().fail('`initAuthenticator` should fail.');
      } catch(err) {
        expect(err).to.be.a(Error);
        expect(err.message).to.match(/`Basic` authentication provider is not configured/);
      }
    });

    it('fails if configured authentication provider is not known.', async () => {
      config.get.withArgs('xpack.security.authProviders').returns(['super-basic']);

      try {
        await initAuthenticator(server);
        expect().fail('`initAuthenticator` should fail.');
      } catch(err) {
        expect(err).to.be.a(Error);
        expect(err.message).to.match(/Unsupported authentication provider name: super-basic/);
      }
    });
  });

  describe('`authenticate` method', () => {
    let authenticate;
    beforeEach(async () => {
      config.get.withArgs('xpack.security.authProviders').returns(['basic']);
      server.plugins.kibana.systemApi.isSystemApiRequest.returns(true);
      session.clear.throws(new Error('`Session.clear` is not supposed to be called!'));

      await initAuthenticator(server);

      // Second argument will be a method we'd like to test.
      authenticate = server.expose.withArgs('authenticate').firstCall.args[1];
    });

    it('fails if request is not provided.', async () => {
      try {
        await authenticate();
        expect().fail('`authenticate` should fail.');
      } catch(err) {
        expect(err).to.be.a(Error);
        expect(err.message).to.be('Request should be a valid object, was [undefined].');
      }
    });

    it('fails if all authentication providers fail.', async () => {
      const request = { headers: { authorization: 'Basic ***' } };
      session.get.withArgs(request).returns(Promise.resolve(null));

      const failureReason = new Error('Not Authorized');
      server.plugins.security.getUser
        .withArgs(request)
        .returns(Promise.reject(failureReason));

      const authenticationResult = await authenticate(request);

      expect(authenticationResult.failed()).to.be(true);
      expect(authenticationResult.error).to.be(failureReason);
    });

    it('returns user that authentication provider returns.', async () => {
      const request = { headers: { authorization: 'Basic ***' } };
      const user = { username: 'user' };
      server.plugins.security.getUser.withArgs(request).returns(Promise.resolve(user));

      const authenticationResult = await authenticate(request);
      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql({
        ...user,
        scope: []
      });
    });

    it('creates session only for non-system API calls.', async () => {
      const user = { username: 'user' };
      const systemAPIRequest = { headers: { authorization: 'Basic xxx' } };
      const notSystemAPIRequest = { headers: { authorization: 'Basic yyy' } };

      server.plugins.kibana.systemApi.isSystemApiRequest
        .withArgs(systemAPIRequest).returns(true)
        .withArgs(notSystemAPIRequest).returns(false);

      server.plugins.security.getUser
        .withArgs(systemAPIRequest).returns(Promise.resolve(user))
        .withArgs(notSystemAPIRequest).returns(Promise.resolve(user));

      const systemAPIAuthenticationResult = await authenticate(systemAPIRequest);
      expect(systemAPIAuthenticationResult.succeeded()).to.be(true);
      expect(systemAPIAuthenticationResult.user).to.be.eql({
        ...user,
        scope: []
      });
      sinon.assert.notCalled(session.set);

      const notSystemAPIAuthenticationResult = await authenticate(notSystemAPIRequest);
      expect(notSystemAPIAuthenticationResult.succeeded()).to.be(true);
      expect(notSystemAPIAuthenticationResult.user).to.be.eql({
        ...user,
        scope: []
      });
      sinon.assert.calledOnce(session.set);
      sinon.assert.calledWithExactly(session.set, notSystemAPIRequest, {
        state: { authorization: notSystemAPIRequest.headers.authorization },
        provider: 'basic'
      });
    });

    it('extends session only for non-system API calls.', async () => {
      const user = { username: 'user' };
      const systemAPIRequest = { headers: { xCustomHeader: 'xxx' } };
      const notSystemAPIRequest = { headers: { xCustomHeader: 'yyy' } };

      session.get.withArgs(systemAPIRequest).returns(Promise.resolve({
        state: { authorization: 'Basic xxx' },
        provider: 'basic'
      }));

      session.get.withArgs(notSystemAPIRequest).returns(Promise.resolve({
        state: { authorization: 'Basic yyy' },
        provider: 'basic'
      }));

      server.plugins.kibana.systemApi.isSystemApiRequest
        .withArgs(systemAPIRequest).returns(true)
        .withArgs(notSystemAPIRequest).returns(false);

      server.plugins.security.getUser
        .withArgs(systemAPIRequest).returns(Promise.resolve(user))
        .withArgs(notSystemAPIRequest).returns(Promise.resolve(user));

      const systemAPIAuthenticationResult = await authenticate(systemAPIRequest);
      expect(systemAPIAuthenticationResult.succeeded()).to.be(true);
      expect(systemAPIAuthenticationResult.user).to.be.eql({
        ...user,
        scope: []
      });
      sinon.assert.notCalled(session.set);

      const notSystemAPIAuthenticationResult = await authenticate(notSystemAPIRequest);
      expect(notSystemAPIAuthenticationResult.succeeded()).to.be(true);
      expect(notSystemAPIAuthenticationResult.user).to.be.eql({
        ...user,
        scope: []
      });
      sinon.assert.calledOnce(session.set);
      sinon.assert.calledWithExactly(session.set, notSystemAPIRequest, {
        state: { authorization: 'Basic yyy' },
        provider: 'basic'
      });
    });

    it('clears session set by provider if it failed to authenticate with active session.', async () => {
      const request = { headers: { } };
      session.clear.withArgs(request).returns(Promise.resolve());

      session.get.withArgs(request).returns(Promise.resolve({
        state: { authorization: 'Basic ***' },
        provider: 'basic'
      }));

      server.plugins.security.getUser
        .withArgs(request).returns(Promise.reject(new Error('Not Authorized')));

      const authenticationResult = await authenticate(request);
      expect(authenticationResult.failed()).to.be(true);

      sinon.assert.calledOnce(session.clear);
      sinon.assert.calledWithExactly(session.clear, request);
    });

    it('complements user with `scope` property.', async () => {
      const user = { username: 'user' };
      const request = { headers: { authorization: 'Basic ***' } };

      server.plugins.security.getUser.withArgs(request)
        .returns(Promise.resolve(user));
      AuthScopeService.prototype.getForRequestAndUser.withArgs(request, user)
        .returns(Promise.resolve(['foo', 'bar']));

      const authenticationResult = await authenticate(request);
      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql({
        ...user,
        scope: ['foo', 'bar']
      });
    });
  });

  describe('`deauthenticate` method', () => {
    let deauthenticate;
    beforeEach(async () => {
      config.get.withArgs('xpack.security.authProviders').returns(['basic']);

      await initAuthenticator(server);

      // Second argument will be a method we'd like to test.
      deauthenticate = server.expose.withArgs('deauthenticate').firstCall.args[1];
    });

    it('fails if request is not provided.', async () => {
      try {
        await deauthenticate();
        expect().fail('`deauthenticate` should fail.');
      } catch(err) {
        expect(err).to.be.a(Error);
        expect(err.message).to.be('Request should be a valid object, was [undefined].');
      }
    });

    it('clears session.', async () => {
      const request = {};

      await deauthenticate(request);

      sinon.assert.calledOnce(session.clear);
      sinon.assert.calledWithExactly(session.clear, request);
    });
  });

  describe('`isAuthenticated` method', () => {
    let isAuthenticated;
    beforeEach(async () => {
      config.get.withArgs('xpack.security.authProviders').returns(['basic']);

      await initAuthenticator(server);

      // Second argument will be a method we'd like to test.
      isAuthenticated = server.expose.withArgs('isAuthenticated').firstCall.args[1];
    });

    it('returns `false` if credentials are not presented.', () => {
      expect(isAuthenticated({
        auth: {}
      })).to.be(false);
    });

    it('returns `false` if credentials do not include username.', () => {
      expect(isAuthenticated({
        auth: {
          credentials: {}
        }
      })).to.be(false);
    });

    it('returns `true` if credentials exist and include username.', () => {
      expect(isAuthenticated({
        auth: {
          credentials: { username: 'user' }
        }
      })).to.be(true);
    });
  });
});
