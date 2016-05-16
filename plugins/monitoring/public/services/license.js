const mod = require('ui/modules').get('monitoring/license', []);

mod.service('license', () => {
  let licenseType;

  return {
    isBasic() {
      return licenseType === 'basic';
    },
    setLicenseType(newType) {
      licenseType = newType;
    }
  };
});
