import { contains } from 'lodash';
import { uiModules } from 'ui/modules';
import { ML_SUPPORTED_LICENSES } from '../../common/constants';

const uiModule = uiModules.get('monitoring/license', []);
uiModule.service('license', () => {
  return new class LicenseService {
    constructor() {
      // do not initialize with usable state
      this.license = {
        type: null,
        expiry_date_in_millis: -Infinity
      };
    }

    // we're required to call this initially
    setLicense(license) {
      this.license = license;
    }

    isBasic() {
      return this.license.type === 'basic';
    }

    mlIsSupported() {
      return contains(ML_SUPPORTED_LICENSES, this.license.type);
    }

    doesExpire() {
      const { expiry_date_in_millis: expiryDateInMillis } = this.license;
      return expiryDateInMillis !== undefined;
    }

    isActive() {
      const { expiry_date_in_millis: expiryDateInMillis } = this.license;
      return (new Date()).getTime() < expiryDateInMillis;
    }

    isExpired() {
      if (this.doesExpire()) {
        const { expiry_date_in_millis: expiryDateInMillis } = this.license;
        return (new Date()).getTime() >= expiryDateInMillis;
      }
      return false;
    }
  };
});
