const _ = require('lodash');
const mod = require('ui/modules').get('monitoring/features', []);

mod.service('features', function ($window) {
  function getData() {
    const monitoringData = $window.localStorage.getItem('monitoring_data');
    return (monitoringData && JSON.parse(monitoringData)) || {};
  }

  function update(featureName, value) {
    const monitoringDataObj = getData();
    monitoringDataObj[featureName] = value;
    $window.localStorage.setItem('monitoring_data', JSON.stringify(monitoringDataObj));
  }

  function isEnabled(featureName, defaultSetting) {
    const monitoringDataObj = getData();
    if (_.has(monitoringDataObj, featureName)) {
      return monitoringDataObj[featureName];
    }

    if (_.isUndefined(defaultSetting)) {
      return false;
    }

    return defaultSetting;
  }

  return {
    isEnabled,
    update
  };
});
