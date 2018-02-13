export function MonitoringElasticsearchOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'elasticsearchOverviewPage';

  return new class ElasticsearchIndices {
    isOnOverview() {
      return retry.try(() => testSubjects.exists(SUBJ_OVERVIEW_PAGE));
    }

  };
}
