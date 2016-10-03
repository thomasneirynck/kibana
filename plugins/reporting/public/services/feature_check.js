const module = require('ui/modules').get('reporting/job_queue');

module.service('reportingFeatureCheck', ($injector) => {
  return {
    shield() {
      return $injector.has('ShieldUser');
    }
  };
});
