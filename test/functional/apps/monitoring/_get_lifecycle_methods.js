export const getLifecycleMethods = (getService, getPageObjects) => {
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  let _archive;

  return {
    async setup(archive, { from, to }) {
      _archive = archive;

      const kibanaServer = getService('kibanaServer');
      const remote = getService('remote');

      await remote.setWindowSize(1600, 1000);

      await esArchiver.load(archive);
      await kibanaServer.uiSettings.replace({
        'dateFormat:tz': 'UTC',
        'telemetry:optIn': false // provide extra height for the page and avoid clusters sending telemetry during tests
      });

      await PageObjects.monitoring.navigateTo();
      await PageObjects.monitoring.getNoDataMessage();

      // pause autorefresh in the time filter because we don't wait any ticks,
      // and we don't want ES to log a warning when data gets wiped out
      await PageObjects.header.pauseAutoRefresh();

      await PageObjects.header.setAbsoluteRange(from, to);
    },

    tearDown() {
      return esArchiver.unload(_archive);
    }
  };
};
