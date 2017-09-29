export function MonitoringElasticsearchIndicesProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_LISTING_PAGE = 'elasticsearchIndicesListing';

  return new class ElasticsearchIndices {
    async isOnListing() {
      return testSubjects.exists(SUBJ_LISTING_PAGE);
    }
  };
}
