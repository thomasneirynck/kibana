export const getLifecycleMethods = (getService, getPageObjects) => ({

  async setup(archive, timeRange) {
    const esArchiver = getService('esArchiver');
    const kibanaServer = getService('kibanaServer');
    const remote = getService('remote');
    const PageObjects = getPageObjects(['monitoring', 'header']);

    await remote.setWindowSize(1600, 1000);

    await esArchiver.load(archive);
    await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

    await PageObjects.monitoring.navigateTo();
    await PageObjects.monitoring.getNoDataMessage();

    await PageObjects.header.setAbsoluteRange(timeRange.from, timeRange.to);
  },

  tearDown(archive) {
    archive = archive || 'monitoring/singlecluster-yellow-platinum';

    const esArchiver = getService('esArchiver');
    return esArchiver.unload(archive);
  }

});
