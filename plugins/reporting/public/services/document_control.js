const url = require('url');
const chrome = require('ui/chrome');
const module = require('ui/modules').get('xpack/reporting');

module.service('reportingDocumentControl', function ($http, Promise, Private, $location) {
  const mainEntry = '/api/reporting/generate';
  const reportPrefix = chrome.addBasePath(mainEntry);

  const docTypes = {
    discover: {
      getParams: (path) => path.match(/\/discover\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/search/${name}?${query}`,
    },
    visualize: {
      getParams: (path) => path.match(/\/visualize\/edit\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/visualization/${name}?${query}`,
    },
    dashboard: {
      getParams: (path) => path.match(/\/dashboard\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/dashboard/${name}?${query}`,
    },
  };

  function parseFromUrl() {
    const { pathname, query } = url.parse($location.url(), false);
    const pathParams = pathname.match(/\/([a-z]+)?(\/?.*)/);

    const type = pathParams[1];
    const docType = docTypes[type];
    if (!docType) throw new Error('Unknown app type: ' + type);

    const params = docType.getParams(pathname);
    const exportable = (!!params);
    const objectId = (exportable) ? params[1] : null;
    const reportPath = (exportable) ? docType.getReportUrl(objectId, query) : null;
    const reportUrl = (exportable) ? url.resolve($location.absUrl(), reportPath) : null;

    return {
      pathname,
      query,
      reportPath,
      reportUrl,
      objectId,
      exportable,
    };
  }

  this.getInfo = () => {
    return parseFromUrl();
  };

  this.isExportable = () => {
    return this.getInfo().exportable;
  };

  this.getUrl = (sync) => {
    const reportUrl = this.getInfo().reportUrl;
    if (!reportUrl) return null;

    if (sync) {
      const parsed = url.parse(reportUrl);
      parsed.search = (parsed.search === null) ? 'sync' : `${parsed.search}&sync`;
      return url.format(parsed);
    }

    return reportUrl;
  };

  this.create = () => {
    const info = this.getInfo();
    if (!info.exportable) return Promise.reject(new Error('not exportable'));
    return $http.get(info.reportPath);
  };
});