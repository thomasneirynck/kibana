export function MonitoringKibanaOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_OVERVIEW_PAGE = 'kibanaOverviewPage';

  return new class KibanaOverview {

    isOnOverview() {
      return testSubjects.exists(SUBJ_OVERVIEW_PAGE);
    }

  };
}
