import sinon from 'sinon';
import expect from 'expect.js';
import Boom from 'boom';

import isAuthenticatedProvider from '../is_authenticated';

const createStubServer = () => ({
  expose: sinon.stub(),
  plugins: {
    security: {
      getUser: sinon.stub()
    }
  }
});

const createStubRequest = () => ({});

const setup = () => {
  const server = createStubServer();
  isAuthenticatedProvider(server);
  const isAuthenticated = server.expose.firstCall.args[1];
  return { server, isAuthenticated };
};

describe('plugins.security#isAuthenticated', () => {
  it('returns true if getUser succeeds', async () => {
    const { isAuthenticated } = setup();
    expect(await isAuthenticated(createStubRequest())).to.be(true);
  });

  it('returns false when getUser throws a 401', async () => {
    const { isAuthenticated, server } = setup();
    server.plugins.security.getUser.returns(Promise.reject(Boom.unauthorized()));
    expect(await isAuthenticated(createStubRequest())).to.be(false);
  });

  it('throw non-boom errors', async () => {
    const { isAuthenticated, server } = setup();
    const nonBoomError = new TypeError();
    server.plugins.security.getUser.returns(Promise.reject(nonBoomError));
    try {
      await isAuthenticated(createStubRequest());
      throw new Error('expected isAuthenticated() to throw');
    } catch (err) {
      expect(err).to.be(nonBoomError);
    }
  });

  it('throw non-401 boom errors', async () => {
    const { isAuthenticated, server } = setup();
    const non401Error = Boom.wrap(new TypeError());
    server.plugins.security.getUser.returns(Promise.reject(non401Error));
    try {
      await isAuthenticated(createStubRequest());
      throw new Error('expected isAuthenticated() to throw');
    } catch (err) {
      expect(err).to.be(non401Error);
    }
  });
});
