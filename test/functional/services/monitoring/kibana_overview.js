export function MonitoringKibanaOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'kibanaOverviewPage';

  return new class KibanaOverview {

    async isOnOverview() {
      const pageId = await retry.try(() => testSubjects.find(SUBJ_OVERVIEW_PAGE));
      return pageId !== null;
    }

  };
}
