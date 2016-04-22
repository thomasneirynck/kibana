import expect from 'expect.js';
import sinon from 'sinon';
import { unauthorized } from 'boom';

import replyFixture from '../../fixtures/reply';
import requestFixture from '../../fixtures/request';
import serverFixture from '../../fixtures/server';

import * as loginScheme from '../../../server/lib/login_scheme';

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
        it('replies with error for non-html requests on error', () => {
          request.raw.req.headers.accept = '*/*';
          server.auth.test.callsArgWith(2, {});
          const { authenticate } = scheme(server);
          authenticate(request, reply);
          sinon.assert.calledWith(reply, {});
        });
      });
    });
  });

  describe('#setExpirationMessage()', () => {
    it('changes error message when error describes an expiration', () => {
      const err = unauthorized('Invalid cookie');
      const result = loginScheme.setExpirationMessage(err);
      expect(result.output.payload.message).to.equal('Session has expired');
    });
    it('preserves original error message when error does not describe an expiration', () => {
      const err = unauthorized();
      const result = loginScheme.setExpirationMessage(err);
      expect(result.output.payload.message).not.to.equal('Session has expired');
    });
    it('returns error', () => {
      const err = unauthorized();
      const result = loginScheme.setExpirationMessage(err);
      expect(result).to.equal(err);
    });
  });
});
