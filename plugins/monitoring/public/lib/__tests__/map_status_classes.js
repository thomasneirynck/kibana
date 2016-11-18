import { statusIconClass, translateKibanaStatus } from '../map_status_classes';
import expect from 'expect.js';

describe('map status classes', function () {
  describe('translate kibana status', function () {
    it('should format known statuses', function () {
      expect(translateKibanaStatus('Red')).to.be('red');
      expect(translateKibanaStatus('Yellow')).to.be('yellow');
      expect(translateKibanaStatus('Green')).to.be('green');
    });

    it('should map unknown statuses to yellow', function () {
      expect(translateKibanaStatus('Unknown')).to.be('yellow');
      expect(translateKibanaStatus('Invalid')).to.be('yellow');
      expect(translateKibanaStatus('abcxyz')).to.be('yellow');
    });
  });

  describe('status icon class', function () {
    it('should show check icon for green status', function () {
      expect(statusIconClass('Green')).to.be('fa fa-check');
    });

    it('should show warning icon for yellow status', function () {
      expect(statusIconClass('Yellow')).to.be('fa fa-warning');
    });

    it('should show bolt icon for other statuses', function () {
      expect(statusIconClass('Red')).to.be('fa fa-bolt');
      expect(statusIconClass('Unknown')).to.be('fa fa-bolt');
      expect(statusIconClass('Invalid')).to.be('fa fa-bolt');
      expect(statusIconClass('abcxyz')).to.be('fa fa-bolt');
    });
  });
});
