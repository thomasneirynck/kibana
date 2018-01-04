export function MonitoringElasticsearchOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_OVERVIEW_PAGE = 'elasticsearchOverviewPage';

  return new class ElasticsearchIndices {
    isOnOverview() {
      return testSubjects.exists(SUBJ_OVERVIEW_PAGE);
    }

  };
}
