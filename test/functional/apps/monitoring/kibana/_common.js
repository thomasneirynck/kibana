export const getLifecycleMethods = (getService, getPageObjects) => ({

  async setup() {
    const esArchiver = getService('esArchiver');
    const kibanaServer = getService('kibanaServer');
    const remote = getService('remote');
    const PageObjects = getPageObjects(['monitoring', 'header']);

    await remote.setWindowSize(1600, 1000);

    await esArchiver.load('monitoring/singlecluster-yellow-platinum');
    const timeRange = {
      from: '2017-08-29 17:24:14.254',
      to: '2017-08-29 17:25:44.142',
    };
    await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

    await PageObjects.monitoring.navigateTo();
    await PageObjects.monitoring.getNoDataMessage();

    await PageObjects.header.setAbsoluteRange(timeRange.from, timeRange.to);
  },

  tearDown() {
    const esArchiver = getService('esArchiver');
    return esArchiver.unload('monitoring/singlecluster-yellow-platinum');
  }

});
