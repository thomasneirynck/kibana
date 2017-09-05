export function MonitoringPageProvider({ getPageObjects, getService }) {
  const PageObjects = getPageObjects(['common', 'header']);
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  return new class MonitoringPage {
    async navigateTo() {
      await PageObjects.common.navigateToApp('monitoring');
    }

    async getAccessDeniedMessage() {
      return testSubjects.getVisibleText('accessDeniedTitle');
    }

    async getNoDataMessage() {
      await retry.try(async () => {
        if (!await testSubjects.exists('noData')) {
          throw new Error('Expected to find the No Data page');
        }
      });
    }

    async assertTableNoData(subj) {
      await retry.try(async () => {
        if (!await testSubjects.exists(subj)) {
          throw new Error('Expected to find the no data message');
        }
      });
    }

    async tableGetRows(subj) {
      const table = await testSubjects.find(subj);
      return table.findAllByTagName('tr');
    }

    async tableSetFilter(subj, text) {
      return await testSubjects.setValue(subj, text);
    }

    async tableClearFilter(subj) {
      return await testSubjects.setValue(subj, ' \uE003'); // space and backspace to trigger onChange event
    }
  };
}
