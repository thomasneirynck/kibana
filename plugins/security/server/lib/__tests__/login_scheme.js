import expect from 'expect.js';
import sinon from 'sinon';

import { replyFixture } from './__fixtures__/reply';
import { requestFixture } from './__fixtures__/request';
import { serverFixture } from './__fixtures__/server';

import { AuthenticationResult } from '../authentication/authentication_result';
import { createScheme } from '../login_scheme';

describe('lib/login_scheme', function () {
  describe('#default()', () => {
    describe('returned function', () => {
      let scheme;
      let params;
      let server;
      let request;
      let reply;

      beforeEach(() => {
        params = {
          redirectUrl: sinon.stub().returns('mock redirect url')
        };

        server = serverFixture();
        request = requestFixture();
        reply = replyFixture();

        scheme = createScheme(params);
      });

      it('returns object with authentication function', () => {
        const { authenticate } = scheme(server);
        expect(authenticate).to.be.a('function');
      });

      describe('returned authentication function', () => {
        it('invokes `authenticate`', async () => {
          server.plugins.security.authenticate.withArgs(request).returns(
            Promise.resolve(AuthenticationResult.succeeded({}))
          );

          const { authenticate } = scheme(server);
          await authenticate(request, reply);

          sinon.assert.calledWithExactly(server.plugins.security.authenticate, request);
        });

        it('continues request with credentials on success', async () => {
          server.plugins.security.authenticate.withArgs(request).returns(
            Promise.resolve(AuthenticationResult.succeeded({}))
          );

          const { authenticate } = scheme(server);
          await authenticate(request, reply);

          sinon.assert.calledWith(reply.continue, { credentials: {} });
        });

        it('redirects html request on error', async () => {
          server.plugins.security.authenticate.withArgs(request).returns(
            Promise.reject(AuthenticationResult.failed(new Error()))
          );

          const { authenticate } = scheme(server);
          await authenticate(request, reply);

          sinon.assert.called(params.redirectUrl);
          sinon.assert.calledWith(reply.redirect, 'mock redirect url');
        });

        it('replies with error for xhr requests on error', async () => {
          request.raw.req.headers['kbn-version'] = 'something';
          server.plugins.security.authenticate.withArgs(request).returns(
            Promise.reject(AuthenticationResult.failed(new Error()))
          );

          const { authenticate } = scheme(server);
          await authenticate(request, reply);

          sinon.assert.called(reply);
          const error = reply.firstCall.args[0];
          expect(error.message).to.be('Unauthorized');
          expect(error.output.payload.statusCode).to.be(401);
        });
      });
    });
  });
});
