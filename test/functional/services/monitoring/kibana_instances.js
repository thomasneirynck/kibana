export function MonitoringKibanaInstancesProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_INSTANCES_PAGE = 'kibanaInstancesPage';

  const SUBJ_TABLE_BODY        = 'kibanaInstancesTableBody';
  const SUBJ_INDEX_LINK_PREFIX = `${SUBJ_TABLE_BODY} kibanaLink-`;

  return new class KibanaInstances {

    isOnInstances() {
      return retry.try(() => testSubjects.exists(SUBJ_INSTANCES_PAGE));
    }

    clickRowByName(instanceName) {
      return testSubjects.click(SUBJ_INDEX_LINK_PREFIX + instanceName);
    }

  };
}
