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
          redirectUrl: sinon.stub().returns('mock redirect url'),
          strategies: ['wat', 'huh'],
          testRequest: sinon.stub(),
          xpackMainPlugin: {
            info: {
              isAvailable: sinon.stub().returns(true),
              feature: () => { return { isEnabled: sinon.stub().returns(true) }; }
            }
          }
        };
        request = requestFixture();
        reply = replyFixture();
        err = new Error();
        credentials = {};
        authenticate = authRedirect.default(params);
      });

      it('invokes testRequest with strategy and request', () => {
        params.testRequest.yields(undefined, credentials);
        return authenticate(request, reply).then(() => {
          params.strategies.forEach((strategy) => {
            sinon.assert.calledWith(params.testRequest, strategy, request);
          });
        });
      });
      it('continues request with credentials on success', () => {
        params.testRequest.yields(undefined, credentials);
        return authenticate(request, reply).then(() => {
          sinon.assert.calledWith(reply.continue, { credentials });
        });
      });

      context('when testRequest fails', () => {
        beforeEach(() => params.testRequest.yields(err));

        it('replies with redirect to redirectUrl() for non-xhr requests', () => {
          return authenticate(request, reply).then(() => {
            sinon.assert.calledWith(params.redirectUrl, request.url.path);
            sinon.assert.calledWith(reply.redirect, 'mock redirect url');
          });
        });
        it('replies with unauthorized for xhr requests', () => {
          request.raw.req.headers['kbn-version'] = 'something';
          return authenticate(request, reply).then(() => {
            sinon.assert.called(reply);
            const error = reply.getCall(0).args[0];
            expect(error.message).to.be('Unauthorized');
            expect(error.output.payload.statusCode).to.be(401);
            sinon.assert.notCalled(reply.continue);
          });
        });
      });

      context('when security is disabled in elasticsearch', () => {
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
    });
  });

  describe('#shouldRedirect()', () => {
    it('returns true if request does not have either a kbn-version or kbn-xsrf header', () => {
      const request = requestFixture();
      const result = authRedirect.shouldRedirect(request);
      expect(result).to.equal(true);
    });
    it('returns false if request has a kbn-version header', () => {
      const request = requestFixture();
      request.raw.req.headers['kbn-version'] = 'something';
      const result = authRedirect.shouldRedirect(request);
      expect(result).to.equal(false);
    });
    it('returns false if request has a kbn-xsrf header', () => {
      const request = requestFixture();
      request.raw.req.headers['kbn-xsrf'] = 'something';
      const result = authRedirect.shouldRedirect(request);
      expect(result).to.equal(false);
    });
  });
});
