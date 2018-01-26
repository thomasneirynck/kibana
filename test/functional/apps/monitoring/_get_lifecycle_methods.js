export const getLifecycleMethods = (getService, getPageObjects) => {
  let _archive;

  return {
    async setup(archive, { from, to }) {
      _archive = archive;

      const esArchiver = getService('esArchiver');
      const kibanaServer = getService('kibanaServer');
      const remote = getService('remote');
      const PageObjects = getPageObjects(['monitoring', 'header']);

      await remote.setWindowSize(1600, 1000);

      await esArchiver.load(archive);
      await kibanaServer.uiSettings.replace({
        'dateFormat:tz': 'UTC',
        'xPackMonitoring:showBanner': false // provide extra height for the page
      });

      await PageObjects.monitoring.navigateTo();
      await PageObjects.monitoring.getNoDataMessage();

      await PageObjects.header.setAbsoluteRange(from, to);
    },

    tearDown() {
      const esArchiver = getService('esArchiver');
      return esArchiver.unload(_archive);
    }
  };
};
