import { expect } from 'chai';
import sinon from 'sinon';
import { create as createError } from 'boom';

import * as errors from '../../../server/lib/errors';

describe('lib/errors', function () {
  describe('#isBoom()', () => {
    it('returns true if error is a Boom error', () => {
      const err = createError(400);
      const result = errors.isBoom(err);
      expect(result).to.equal(true);
    });
    it('returns false if error is not a Boom error', () => {
      const err = new Error();
      const result = errors.isBoom(err);
      expect(result).to.equal(false);
    });
  });

  describe('#isInvalidCookie()', () => {
    it('returns true if error message payload indicates an invalid cookie', () => {
      const err = createError(400, 'Invalid cookie');
      const result = errors.isInvalidCookie(err);
      expect(result).to.equal(true);
    });
    it('returns false if error message payload does not indicate an invalid cookie', () => {
      const err = createError(400);
      const result = errors.isInvalidCookie(err);
      expect(result).to.equal(false);
    });
  });

  describe('#isUnauthorized()', () => {
    it('returns true if error status is 401', () => {
      const err = createError(401);
      const result = errors.isUnauthorized(err);
      expect(result).to.equal(true);
    });
    it('returns false if error status is not 401', () => {
      const err = createError(400);
      const result = errors.isUnauthorized(err);
      expect(result).to.equal(false);
    });
  });
});
