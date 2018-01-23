/*
 * TODO extract this helper so it can be used for all Monitoring test
 * https://github.com/elastic/x-pack-kibana/pull/4247
 */
export const getLifecycleMethods = (getService, getPageObjects) => ({

  async setup()  {
    const esArchiver = getService('esArchiver');
    const kibanaServer = getService('kibanaServer');
    const remote = getService('remote');
    const PageObjects = getPageObjects(['monitoring', 'header']);

    remote.setWindowSize(1600, 1000);

    await esArchiver.load('monitoring/beats');
    await kibanaServer.uiSettings.replace({
      'dateFormat:tz': 'UTC',
      'xPackMonitoring:showBanner': false // provide extra height for the page, avoid flaky link clicking
    });

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
