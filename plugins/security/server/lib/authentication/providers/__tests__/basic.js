import expect from 'expect.js';
import sinon from 'sinon';

import { BasicAuthenticationProvider, BasicCredentials } from '../basic';

function generateAuthorizationHeader(username, password) {
  const { headers: { authorization } } = BasicCredentials.decorateRequest(
    { headers: {} }, username, password
  );

  return authorization;
}

describe('BasicAuthenticationProvider', () => {
  describe('`authenticate` method', () => {
    let provider;
    let getUser;
    beforeEach(() => {
      getUser = sinon.stub();
      provider = new BasicAuthenticationProvider(getUser);
    });

    it('do not handle authentication if both `authorization` header and state are not available.', async () => {
      const authenticationResult = await provider.authenticate(
        { headers: {} },
        null
      );

      expect(authenticationResult.notHandled()).to.be(true);
    });

    it('fails if state exists, but authorization property is missing.',
    async () => {
      const authenticationResult = await provider.authenticate(
        { headers: {} },
        {}
      );

      expect(authenticationResult.failed()).to.be(true);
      expect(authenticationResult.error).to.be.a(Error);
      expect(authenticationResult.error.message).to.be('Provider state is not valid.');
    });

    it('succeeds if only `authorization` header is available.', async () => {
      const request = BasicCredentials.decorateRequest({ headers: {} }, 'user', 'password');
      const user = { username: 'user' };
      getUser.withArgs(request).returns(Promise.resolve(user));

      const authenticationResult = await provider.authenticate(request);

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql(user);
      expect(authenticationResult.state).to.be.eql({ authorization: request.headers.authorization });
      sinon.assert.calledOnce(getUser);
    });

    it('succeeds if only state is available.', async () => {
      const request = { headers: {} };
      const user = { username: 'user' };
      const authorization = generateAuthorizationHeader('user', 'password');

      getUser.withArgs({ headers: { authorization } }).returns(Promise.resolve(user));

      const authenticationResult = await provider.authenticate(request, { authorization });

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql(user);
      expect(authenticationResult.state).to.be.eql({ authorization: request.headers.authorization });
      sinon.assert.calledOnce(getUser);
    });

    it('authenticates via state if `authorization` is not supported.', async () => {
      const request = { headers: { authorization: 'Bearer ***' } };
      const user = { username: 'user' };
      const authorization = generateAuthorizationHeader('user', 'password');

      getUser.withArgs({ headers: { authorization } }).returns(Promise.resolve(user));

      const authenticationResult = await provider.authenticate(request, { authorization });

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql(user);
      expect(authenticationResult.state).to.be.eql({ authorization: request.headers.authorization });
      sinon.assert.calledOnce(getUser);
    });

    it('fails if state contains invalid credentials.', async () => {
      const request = { headers: {} };
      const authorization = generateAuthorizationHeader('user', 'password');

      const authenticationError = new Error('Forbidden');
      getUser.withArgs({ headers: { authorization } }).returns(
        Promise.reject(authenticationError)
      );

      const authenticationResult = await provider.authenticate(request, { authorization });

      expect(authenticationResult.failed()).to.be(true);
      expect(authenticationResult.user).to.be.eql(undefined);
      expect(authenticationResult.state).to.be.eql(undefined);
      expect(authenticationResult.error).to.be.eql(authenticationError);
      sinon.assert.calledOnce(getUser);
    });

    it('authenticates only via `authorization` header even if state is available.', async () => {
      const request = BasicCredentials.decorateRequest({ headers: {} }, 'user', 'password');
      const user = { username: 'user' };
      const authorization = generateAuthorizationHeader('user1', 'password2');

      // GetUser will be called with request's `authorization` header.
      getUser.withArgs(request).returns(Promise.resolve(user));

      const authenticationResult = await provider.authenticate(request, { authorization });

      expect(authenticationResult.succeeded()).to.be(true);
      expect(authenticationResult.user).to.be.eql(user);
      expect(authenticationResult.state).to.be.eql({ authorization: request.headers.authorization });
      sinon.assert.calledOnce(getUser);
    });
  });

  describe('BasicCredentials', () => {
    it('`decorateRequest` fails if username or password is not provided.', () => {
      expect(() => BasicCredentials.decorateRequest()).to
        .throwError(/Request should be a valid object/);
      expect(() => BasicCredentials.decorateRequest({})).to
        .throwError(/Username should be a valid non-empty string/);
      expect(() => BasicCredentials.decorateRequest({}, '')).to
        .throwError(/Username should be a valid non-empty string/);
      expect(() => BasicCredentials.decorateRequest({}, '', '')).to
        .throwError(/Username should be a valid non-empty string/);
      expect(() => BasicCredentials.decorateRequest({}, 'username', '')).to
        .throwError(/Password should be a valid non-empty string/);
      expect(() => BasicCredentials.decorateRequest({}, '', 'password')).to
        .throwError(/Username should be a valid non-empty string/);
    });

    it('`decorateRequest` correctly sets authorization header.', () => {
      const oneRequest = { headers: {} };
      const anotherRequest = { headers: { authorization: 'Basic ***' } };

      BasicCredentials.decorateRequest(oneRequest, 'one-user', 'one-password');
      BasicCredentials.decorateRequest(anotherRequest, 'another-user', 'another-password');

      expect(oneRequest.headers.authorization).to.be('Basic b25lLXVzZXI6b25lLXBhc3N3b3Jk');
      expect(anotherRequest.headers.authorization).to.be('Basic YW5vdGhlci11c2VyOmFub3RoZXItcGFzc3dvcmQ=');
    });
  });
});
