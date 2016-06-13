const module = require('ui/modules').get('reporting/job_queue');
module.service('reportingDocumentCreate', ($http, Promise, Private) => {
  const appInfo = Private(require('plugins/reporting/app_info'));

  return () => {
    const info = appInfo();
    if (!info.exportable) return Promise.reject(new Error('not exportable'));

    return $http.get(info.reportUrl);
  };
});
