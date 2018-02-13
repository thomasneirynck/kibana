export function MonitoringElasticsearchNodesProvider({ getService/*, getPageObjects */ }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_LISTING_PAGE = 'elasticsearchNodesListingPage';
  const SUBJ_TABLE_BODY = 'nodesTableBody';
  const SUBJ_NODE_LINK_PREFIX = `${SUBJ_TABLE_BODY} nodeLink-`;

  return new class ElasticsearchIndices {
    isOnListing() {
      return retry.try(() => testSubjects.exists(SUBJ_LISTING_PAGE));
    }

    clickRowByResolver(nodeResolver) {
      return testSubjects.click(SUBJ_NODE_LINK_PREFIX + nodeResolver);
    }

  };
}
