export function MonitoringClusterListProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const getVisibleTextForSubj = async subj => {
    const el = await testSubjects.find(subj);
    return el.getVisibleText();
  };
  const retry = getService('retry');
  const PageObjects = getPageObjects(['monitoring']);

  const SUBJ_TABLE_CONTAINER = 'clusterTableContainer';
  const SUBJ_TABLE_BODY = 'clusterTableBody';
  const SUBJ_TABLE_NO_DATA = `${SUBJ_TABLE_CONTAINER} monitoringTableNoData`;
  const SUBJ_SEARCH_BAR = `${SUBJ_TABLE_CONTAINER} monitoringTableSearchBar`;

  const SUBJ_CLUSTER_ROW_PREFIX = `${SUBJ_TABLE_CONTAINER} clusterRow_`;

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

    getClusterLink(clusterUuid) {
      return testSubjects.find(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} clusterLink`);
    }
    getClusterName(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} clusterLink`);
    }
    getClusterStatus(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} alertsStatus`);
    }
    getClusterNodesCount(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} nodesCount`);
    }
    getClusterIndicesCount(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} indicesCount`);
    }
    getClusterDataSize(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} dataSize`);
    }
    getClusterLogstashCount(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} logstashCount`);
    }
    getClusterKibanaCount(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} kibanaCount`);
    }
    getClusterLicense(clusterUuid) {
      return getVisibleTextForSubj(`${SUBJ_CLUSTER_ROW_PREFIX}${clusterUuid} clusterLicense`);
    }
  };
}
