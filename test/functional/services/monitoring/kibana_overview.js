export function MonitoringKibanaOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'kibanaOverviewPage';

  return new class KibanaOverview {

    isOnOverview() {
      return retry.try(() => testSubjects.exists(SUBJ_OVERVIEW_PAGE));
    }

  };
}
