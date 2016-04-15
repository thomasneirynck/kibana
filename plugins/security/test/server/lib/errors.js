import expect from 'expect.js';
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

  describe('#wrapError', () => {
    it('returns given object', () => {
      const err = new Error();
      const returned = errors.wrapError(err);
      expect(returned).to.equal(err);
    });
    it('error becomes boom error', () => {
      const err = new Error();
      errors.wrapError(err);
      expect(err.isBoom).to.equal(true);
    });
    it('defaults output.statusCode to 500', () => {
      const err = new Error();
      errors.wrapError(err);
      expect(err.output.statusCode).to.equal(500);
    });
    it('sets output.statusCode to .status if given', () => {
      const err = new Error();
      err.status = 400;
      errors.wrapError(err);
      expect(err.output.statusCode).to.equal(400);
    });
    it('defaults message to "Internal Server Error"', () => {
      const err = new Error();
      errors.wrapError(err);
      expect(err.message).to.equal('Internal Server Error');
    });
    it('sets custom message if a 400 level error', () => {
      const err = new Error('wat');
      err.status = 499;
      errors.wrapError(err);
      expect(err.output.payload.message).to.equal('wat');
    });
  });
});
