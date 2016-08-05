import expect from 'expect.js';
import sinon from 'sinon';

import replyFixture from '../../../__test__/fixtures/reply';
import requestFixture from '../../../__test__/fixtures/request';
import serverFixture from '../../../__test__/fixtures/server';

import * as loginScheme from '../login_scheme';

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
          redirectUrl: sinon.stub().returns('mock redirect url'),
          strategies: ['wat', 'huh']
        };
        server = serverFixture();
        request = requestFixture();
        reply = replyFixture();

        scheme = loginScheme.default(params);
      });

      it('returns object with authentication function', () => {
        const { authenticate } = scheme(server);
        expect(authenticate).to.be.a('function');
      });

      describe('returned authentication function', () => {
        it('invokes server.auth.test with strategies', () => {
          const { authenticate } = scheme(server);
          authenticate(request, reply).then(() => {
            params.strategies.forEach((strategy) => {
              sinon.assert.calledWith(server.auth.test, strategy);
            });
          });
        });
        it('continues request with credentials on success', (done) => {
          server.auth.test.yields(undefined, {});
          const { authenticate } = scheme(server);
          authenticate(request, reply).then(() => {
            sinon.assert.called(reply.continue);
            done();
          });
        });
        it('redirects html request on error', (done) => {
          server.auth.test.yields(new Error());
          const { authenticate } = scheme(server);
          authenticate(request, reply).then(() => {
            sinon.assert.called(params.redirectUrl);
            sinon.assert.calledWith(reply.redirect, 'mock redirect url');
            done();
          });
        });
        it('replies with error for xhr requests on error', (done) => {
          request.raw.req.headers['kbn-version'] = 'something';
          server.auth.test.yields(new Error());
          const { authenticate } = scheme(server);
          authenticate(request, reply).then(() => {
            sinon.assert.called(reply);
            const error = reply.getCall(0).args[0];
            expect(error.message).to.be('Unauthorized');
            expect(error.output.payload.statusCode).to.be(401);
            done();
          });
        });
      });
    });
  });
});
