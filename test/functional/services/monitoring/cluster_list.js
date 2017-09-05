export function MonitoringClusterListProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');
  const PageObjects = getPageObjects(['monitoring']);

  const SUBJ_TABLE_CONTAINER = 'clusterTableContainer';
  const SUBJ_TABLE_BODY = 'clusterTableBody';
  const SUBJ_TABLE_NO_DATA = 'clusterTableContainer monitoringTableNoData';
  const SUBJ_SEARCH_BAR = 'clusterTableContainer monitoringTableSearchBar';

  return new class ClusterList {

    async assertDefaults() {
      await retry.try(async () => {
        if (!await testSubjects.exists(SUBJ_TABLE_CONTAINER)) {
          throw new Error('Expected to find the cluster list');
        }
      });
    }

    assertNoData() {
      return PageObjects.monitoring.assertTableNoData(SUBJ_TABLE_NO_DATA);
    }

    getRows() {
      return PageObjects.monitoring.tableGetRows(SUBJ_TABLE_BODY);
    }

    setFilter(text) {
      return PageObjects.monitoring.tableSetFilter(SUBJ_SEARCH_BAR, text);
    }

    clearFilter() {
      return PageObjects.monitoring.tableClearFilter(SUBJ_SEARCH_BAR);
    }

    getClusterLink(clusterLinkSubj) {
      return testSubjects.find(clusterLinkSubj);
    }
  };
}
