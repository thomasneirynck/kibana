import expect from 'expect.js';
import { isRoleEnabled } from '../role';

describe('role', () => {
  describe('isRoleEnabled', () => {
    it('should return false if role is explicitly not enabled', () => {
      const testRole = {
        transient_metadata: {
          enabled: false
        }
      };
      expect(isRoleEnabled(testRole)).to.be(false);
    });

    it('should return true if role is explicitly enabled', () => {
      const testRole = {
        transient_metadata: {
          enabled: true
        }
      };
      expect(isRoleEnabled(testRole)).to.be(true);
    });

    it('should return true if role is NOT explicitly enabled or disabled', () => {
      const testRole = {};
      expect(isRoleEnabled(testRole)).to.be(true);
    });
  });
});
