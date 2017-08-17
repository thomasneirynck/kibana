export function MonitoringPageProvider({ getPageObjects, getService }) {
  const PageObjects = getPageObjects(['common', 'header']);
  const testSubjects = getService('testSubjects');

  return new class MonitoringPage {
    async navigateTo() {
      await PageObjects.common.navigateToApp('monitoring');
    }

    async getAccessDeniedMessage() {
      return testSubjects.getVisibleText('accessDeniedTitle');
    }
  };
}
