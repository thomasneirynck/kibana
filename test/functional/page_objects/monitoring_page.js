export function MonitoringPageProvider({ getService, getPageObjects }) {
  const remote = getService('remote');
  const log = getService('log');
  const kibanaServer = getService('kibanaServer');
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['common', 'header']);
  const testSubjects = getService('testSubjects');

  class MonitoringPage {
    async initTests() {
      await kibanaServer.uiSettings.disableToastAutohide();
      log.debug('MonitoringPage:initTests');
      await esArchiver.load('empty_kibana');
      await esArchiver.loadIfNeeded('logstash_functional');
      remote.setWindowSize(1600,1000);
    }


    async navigateTo() {
      await PageObjects.common.navigateToApp('monitoring');

    }


    async getAccessDeniedMessage() {
      return testSubjects.getVisibleText('accessDeniedTitle');
    }
}
  return new MonitoringPage();
}
