import expect from 'expect.js';
import {hasSessionExpired} from '../get_cookie_validate';

describe('Cookie validate', function () {
  describe('hasSessionExpired', () => {
    it('should return true if the expiry is before now', function () {
      const expires = new Date(Date.now() - 1000);
      const session = {expires};
      expect(hasSessionExpired(session)).to.equal(true);
    });

    it('should return false if the expiry is after now', function () {
      const expires = new Date(Date.now() + 1000);
      const session = {expires};
      expect(hasSessionExpired(session)).to.equal(false);
    });

    it('should return false if there is no expiry', function () {
      const session = {};
      expect(hasSessionExpired(session)).to.equal(false);
    });
  });
});
