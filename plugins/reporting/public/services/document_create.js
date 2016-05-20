const Notifier = require('ui/notify/notifier');

const module = require('ui/modules').get('reporting/job_queue');
module.service('reportingDocumentCreate', ($http, Promise, Private) => {
  const appInfo = Private(require('plugins/reporting/app_info'));

  return () => {
    const genericNotifier = new Notifier({ location: 'Reporting' });
    const info = appInfo();
    if (!info.exportable) return Promise.reject(new Error('not exportable'));

    return $http.get(info.reportUrl)
    .then(() => {
      genericNotifier.info('Document generation has been queued. You can track its progress under Settings.');
    });
  };
});
