export function MonitoringElasticsearchOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'elasticsearchOverviewPage';

  return new class ElasticsearchIndices {
    async isOnOverview() {
      const pageId = await retry.try(() => testSubjects.find(SUBJ_OVERVIEW_PAGE));
      return pageId !== null;
    }

  };
}
