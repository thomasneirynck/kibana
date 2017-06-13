import expect from 'expect.js';
import { wrapUnknownError } from '../wrap_unknown_error';

describe('wrap_unknown_error', () => {
  describe('#wrapUnknownError', () => {
    it('should return a Boom object', () => {
      const originalError = new Error('I am an error');
      const wrappedError = wrapUnknownError(originalError);

      expect(wrappedError.isBoom).to.be(true);
    });
  });
});
