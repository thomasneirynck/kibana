export const getLifecycleMethods = (getService, getPageObjects) => ({

  async setup()  {
    const esArchiver = getService('esArchiver');
    const kibanaServer = getService('kibanaServer');
    const remote = getService('remote');
    const PageObjects = getPageObjects(['monitoring', 'header']);

    remote.setWindowSize(1600, 1000);

    await esArchiver.load('monitoring/beats');
    await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

    await PageObjects.monitoring.navigateTo();
    await PageObjects.monitoring.getNoDataMessage();

    const fromTime = '2017-12-19 17:15:09.302';
    const toTime = '2017-12-19 18:15:09.302';
    await PageObjects.header.setAbsoluteRange(fromTime, toTime);
  },

  async tearDown() {
    const esArchiver = getService('esArchiver');
    return esArchiver.unload('monitoring/beats');
  }

});
