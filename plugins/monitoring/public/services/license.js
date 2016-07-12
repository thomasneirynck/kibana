import uiModules from 'ui/modules';

const mod = uiModules.get('monitoring/license', []);
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
