export function MonitoringLogstashSummaryStatusProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_SUMMARY = 'logstashSummaryStatus';
  const SUBJ_SUMMARY_NODE_COUNT = `${SUBJ_SUMMARY} node_count`;
  const SUBJ_SUMMARY_MEMORY_USED = `${SUBJ_SUMMARY} memory_used`;
  const SUBJ_SUMMARY_EVENTS_IN_TOTAL = `${SUBJ_SUMMARY} events_in_total`;
  const SUBJ_SUMMARY_EVENTS_OUT_TOTAL = `${SUBJ_SUMMARY} events_out_total`;

  return new class LogstashSummaryStatus {

    async getContent() {
      return {
        nodeCount: await testSubjects.getVisibleText(SUBJ_SUMMARY_NODE_COUNT),
        memoryUsed: await testSubjects.getVisibleText(SUBJ_SUMMARY_MEMORY_USED),
        eventsInTotal: await testSubjects.getVisibleText(SUBJ_SUMMARY_EVENTS_IN_TOTAL),
        eventsOutTotal: await testSubjects.getVisibleText(SUBJ_SUMMARY_EVENTS_OUT_TOTAL),
      };
    }

  };
}
