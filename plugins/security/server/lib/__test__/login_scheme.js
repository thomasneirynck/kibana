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
          strategy: 'wat'
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
        it('invokes server.auth.test with strategy', () => {
          const { authenticate } = scheme(server);
          authenticate(request, reply);
          sinon.assert.calledWith(server.auth.test, params.strategy);
        });
        it('continues request with credentials on success', () => {
          server.auth.test.callsArg(2);
          const { authenticate } = scheme(server);
          authenticate(request, reply);
          sinon.assert.called(reply.continue);
        });
        it('redirects html request on error', () => {
          server.auth.test.callsArgWith(2, {});
          const { authenticate } = scheme(server);
          authenticate(request, reply);
          sinon.assert.called(params.redirectUrl);
          sinon.assert.calledWith(reply.redirect, 'mock redirect url');
        });
        it('replies with error for xhr requests on error', () => {
          request.raw.req.headers['kbn-version'] = 'something';
          server.auth.test.callsArgWith(2, {});
          const { authenticate } = scheme(server);
          authenticate(request, reply);
          sinon.assert.calledWith(reply, {});
        });
      });
    });
  });
});
