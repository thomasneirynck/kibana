import expect from 'expect.js';
import sinon from 'sinon';

import replyFixture from '../../../__test__/fixtures/reply';
import requestFixture from '../../../__test__/fixtures/request';

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
          testRequest: sinon.stub(),
          xpackInfo: {
            isAvailable: sinon.stub().returns(true),
            feature: () => { return { isEnabled: sinon.stub().returns(true) }; }
          },
          clientCookieName: 'user'
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

        it('replies with redirect to redirectUrl() for non-xhr requests', () => {
          authenticate(request, reply);
          sinon.assert.calledWith(params.redirectUrl, request.url.path);
          sinon.assert.calledWith(reply.redirect, 'mock redirect url');
        });
        it('replies with result of onError() for xhr requests', () => {
          request.raw.req.headers['kbn-version'] = 'something';
          authenticate(request, reply);
          sinon.assert.calledWith(params.onError, err);
          sinon.assert.calledWith(reply, 'mock error');
        });
      });

      context('when security is disabled in elasticsearch', () => {
        beforeEach(() => {
          params.xpackInfo.feature = () => {
            return {
              isEnabled: sinon.stub().returns(false)
            };
          };
        });

        it ('replies with no credentials', () => {
          authenticate(request, reply);
          sinon.assert.calledWith(reply.continue, { credentials: {} });
          sinon.assert.calledWith(reply.unstate, 'user');
        });
      });
    });
  });

  describe('#shouldRedirect()', () => {
    it('returns true if request does not have a kbn-version header', () => {
      const req = { headers: {} };
      const result = authRedirect.shouldRedirect(req);
      expect(result).to.equal(true);
    });
    it('returns false if request has a kbn-version header', () => {
      const req = { headers: { 'kbn-version': 'something' } };
      const result = authRedirect.shouldRedirect(req);
      expect(result).to.equal(false);
    });
  });
});
