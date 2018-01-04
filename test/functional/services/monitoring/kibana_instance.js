export function MonitoringKibanaInstanceProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_INSTANCE_PAGE = 'kibanaInstancePage';

  const SUBJ_SUMMARY = 'kibanaInstanceStatus';
  const SUBJ_SUMMARY_TRANSPORT_ADDRESS = `${SUBJ_SUMMARY} transportAddress`;
  const SUBJ_SUMMARY_OS_FREE_MEMORY = `${SUBJ_SUMMARY} osFreeMemory`;
  const SUBJ_SUMMARY_VERSION = `${SUBJ_SUMMARY} version`;
  const SUBJ_SUMMARY_UPTIME = `${SUBJ_SUMMARY} uptime`;
  const SUBJ_SUMMARY_HEALTH = `${SUBJ_SUMMARY} statusIcon`;

  return new class KibanaInstance {

    isOnInstance() {
      return testSubjects.exists(SUBJ_INSTANCE_PAGE);
    }

    async getSummary() {
      return {
        transportAddress: await testSubjects.getVisibleText(SUBJ_SUMMARY_TRANSPORT_ADDRESS),
        osFreeMemory: await testSubjects.getVisibleText(SUBJ_SUMMARY_OS_FREE_MEMORY),
        version: await testSubjects.getVisibleText(SUBJ_SUMMARY_VERSION),
        uptime: await testSubjects.getVisibleText(SUBJ_SUMMARY_UPTIME),
        health: await testSubjects.getProperty(SUBJ_SUMMARY_HEALTH, 'alt'),
      };
    }

  };
}
