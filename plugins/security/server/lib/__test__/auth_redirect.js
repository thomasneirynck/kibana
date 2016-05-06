import expect from 'expect.js';
import sinon from 'sinon';

import replyFixture from '../../../test/fixtures/reply';
import requestFixture from '../../../test/fixtures/request';

import * as authRedirect from '../auth_redirect';

describe('lib/auth_redirect', function () {
  describe('#default()', () => {
    describe('returned function', () => {
      let authenticate;
      let params;
      let request;
      let reply;
      let err;
      let credentials;

      beforeEach(() => {
        params = {
          onError: sinon.stub().returns('mock error'),
          redirectUrl: sinon.stub().returns('mock redirect url'),
          strategy: 'wat',
          testRequest: sinon.stub()
        };
        request = requestFixture();
        reply = replyFixture();
        err = new Error();
        credentials = {};
        authenticate = authRedirect.default(params);
      });

      it('invokes testRequest with strategy and request', () => {
        authenticate(request, reply);
        sinon.assert.calledWith(params.testRequest, params.strategy, request);
      });
      it('continues request with credentials on success', () => {
        params.testRequest.callsArgWith(2, undefined, credentials);
        authenticate(request, reply);
        sinon.assert.calledWith(reply.continue, { credentials });
      });

      context('when testRequest fails', () => {
        beforeEach(() => params.testRequest.callsArgWith(2, err));

        it('replies with result of redirectUrl() as a redirect', () => {
          authenticate(request, reply);
          sinon.assert.calledWith(params.redirectUrl, request.url.path);
          sinon.assert.calledWith(reply.redirect, 'mock redirect url');
        });
        it('replies with result of onError()', () => {
          request.raw.req.headers.accept = '*/*';
          authenticate(request, reply);
          sinon.assert.calledWith(params.onError, err);
          sinon.assert.calledWith(reply, 'mock error');
        });
      });
    });
  });

  describe('#shouldRedirect()', () => {
    it('does returns true if request explicitly accepts html', () => {
      const req = { headers: { accept: 'text/html' } };
      const result = authRedirect.shouldRedirect(req);
      expect(result).to.equal(true);
    });
    it('does returns false if request does not explicitly accept html', () => {
      const req = { headers: { accept: '*/*' } };
      const result = authRedirect.shouldRedirect(req);
      expect(result).to.equal(false);
    });
  });
});
