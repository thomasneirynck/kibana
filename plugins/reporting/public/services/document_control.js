import chrome from 'ui/chrome';
import rison from 'rison-node';
import { uiModules } from 'ui/modules';

uiModules.get('xpack/reporting')
.service('reportingDocumentControl', function (Private, $http) {
  const mainEntry = '/api/reporting/generate';
  const reportPrefix = chrome.addBasePath(mainEntry);

  const getJobParams = (exportType, controller) => {
    const jobParamsProvider = Private(exportType.JobParamsProvider);
    return jobParamsProvider(controller);
  };

  this.getPath = async (exportType, controller) => {
    const jobParams = await getJobParams(exportType, controller);
    return `${reportPrefix}/${exportType.id}?jobParams=${rison.encode(jobParams)}`;
  };

  this.create = (relativePath) => {
    return $http.post(relativePath, {});
  };
});
