import expect from 'expect.js';
import sinon from 'sinon';

import { replyFixture } from './__fixtures__/reply';
import { requestFixture } from './__fixtures__/request';
import { serverFixture } from './__fixtures__/server';

import { AuthenticationResult } from '../authentication/authentication_result';
import { authenticateFactory, shouldRedirect } from '../auth_redirect';

describe('lib/auth_redirect', function () {
  describe('#default()', () => {
    describe('returned function', () => {
      let authenticate;
      let params;
      let request;
      let reply;
      let err;
      let credentials;
      let server;

      beforeEach(() => {
        request = requestFixture();
        reply = replyFixture();
        err = new Error();
        credentials = {};
        server = serverFixture();

        params = {
          redirectUrl: sinon.stub().returns('mock redirect url'),
          server,
          xpackMainPlugin: {
            info: {
              license: {
                isOneOf: sinon.stub().returns(false)
              },
              isAvailable: sinon.stub().returns(true),
              feature: () => { return { isEnabled: sinon.stub().returns(true) }; }
            }
          }
        };

        authenticate = authenticateFactory(params);

        params.server.plugins.security.authenticate.withArgs(request).returns(
          Promise.resolve(AuthenticationResult.succeeded(credentials))
        );
      });

      it('invokes `authenticate` with request', async () => {
        await authenticate(request, reply);

        sinon.assert.calledWithExactly(params.server.plugins.security.authenticate, request);
      });

      it('continues request with credentials on success', async () => {
        await authenticate(request, reply);

        sinon.assert.calledWith(reply.continue, { credentials });
      });

      describe('when `authenticate` throws unhandled exception', () => {
        beforeEach(() => {
          params.server.plugins.security.authenticate
            .withArgs(request)
            .returns(Promise.reject(err));
        });

        it('replies with redirect to redirectUrl() for non-xhr requests', async () => {
          await authenticate(request, reply);

          sinon.assert.calledWithExactly(server.log, ['error', 'authentication'], err);
          sinon.assert.calledWithExactly(params.redirectUrl, request.url.path);
          sinon.assert.calledWithExactly(reply.redirect, 'mock redirect url');
        });

        it('replies with unauthorized for xhr requests', async () => {
          request.raw.req.headers['kbn-version'] = 'something';
          await authenticate(request, reply);

          sinon.assert.calledWithExactly(server.log, ['error', 'authentication'], err);
          sinon.assert.calledWithExactly(reply, sinon.match({
            message: 'Unauthorized',
            output: {
              payload: { statusCode: 401 }
            }
          }));
          sinon.assert.notCalled(reply.continue);
        });
      });

      describe('when `authenticate` fails to authenticate user', () => {
        beforeEach(() => {
          params.server.plugins.security.authenticate
            .withArgs(request)
            .returns(Promise.resolve(AuthenticationResult.failed(err)));
        });

        it('replies with redirect to redirectUrl() for non-xhr requests', async () => {
          await authenticate(request, reply);

          sinon.assert.calledWithExactly(params.redirectUrl, request.url.path);
          sinon.assert.calledWithExactly(reply.redirect, 'mock redirect url');
        });

        it('replies with unauthorized for xhr requests', async () => {
          request.raw.req.headers['kbn-version'] = 'something';
          await authenticate(request, reply);

          sinon.assert.calledWithExactly(reply, sinon.match({
            message: 'Unauthorized',
            output: {
              payload: { statusCode: 401 }
            }
          }));
          sinon.assert.notCalled(reply.continue);
        });
      });

      describe('when security is disabled in elasticsearch', () => {
        beforeEach(() => {
          params.xpackMainPlugin.info.feature = () => {
            return {
              isEnabled: sinon.stub().returns(false)
            };
          };
        });

        it ('replies with no credentials', () => {
          authenticate(request, reply);
          sinon.assert.calledWith(reply.continue, { credentials: {} });
        });
      });

      describe('when license is basic', () => {
        beforeEach(() => {
          params.xpackMainPlugin.info.license.isOneOf = sinon.stub().returns(true);
        });

        it ('replies with no credentials', () => {
          authenticate(request, reply);
          sinon.assert.calledWith(reply.continue, { credentials: {} });
        });
      });
    });
  });

  describe('#shouldRedirect()', () => {
    it('returns true if request does not have either a kbn-version or kbn-xsrf header', () => {
      const request = requestFixture();
      const result = shouldRedirect(request);
      expect(result).to.equal(true);
    });
    it('returns false if request has a kbn-version header', () => {
      const request = requestFixture();
      request.raw.req.headers['kbn-version'] = 'something';
      const result = shouldRedirect(request);
      expect(result).to.equal(false);
    });
    it('returns false if request has a kbn-xsrf header', () => {
      const request = requestFixture();
      request.raw.req.headers['kbn-xsrf'] = 'something';
      const result = shouldRedirect(request);
      expect(result).to.equal(false);
    });
  });
});
