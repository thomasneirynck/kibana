module.exports = function urlInfo($location) {
  const docTypes = {
    discover: {
      exportable: (path) => !!path.match(/\/discover\/(.+)/),
    },
    visualize: {
      exportable: (path) => !!path.match(/\/visualize\/edit\/(.+)/),

    },
    dashboard: {
      exportable: (path) => !!path.match(/\/dashboard\/(.+)/),
    },
  };

  function parseUrl(type) {
    const url = $location.$$url;
    const path = $location.$$path;
    const hash = $location.$$hash;
    const docType = docTypes[type];

    if (!docType) throw new Error('Invalid app type: ' + type);

    console.log({
      url,
      path,
      hash,
      exportable: docType.exportable(path),
    });
  }

  return parseUrl;
};
