export function MonitoringBeatDetailProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_DETAIL_PAGE = 'beatDetailPage';
  const SUBJ_SUMMARY_01 = 'beatSummaryStatus01';
  const SUBJ_SUMMARY_NAME = `${SUBJ_SUMMARY_01} name`;
  const SUBJ_SUMMARY_VERSION = `${SUBJ_SUMMARY_01} version`;
  const SUBJ_SUMMARY_TYPE = `${SUBJ_SUMMARY_01} type`;
  const SUBJ_SUMMARY_HOST = `${SUBJ_SUMMARY_01} host`;
  const SUBJ_SUMMARY_OUTPUT = `${SUBJ_SUMMARY_01} output`;
  const SUBJ_SUMMARY_CONFIG_RELOADS = `${SUBJ_SUMMARY_01} configReloads`;
  const SUBJ_SUMMARY_UPTIME = `${SUBJ_SUMMARY_01} uptime`;

  const SUBJ_SUMMARY_02 = 'beatSummaryStatus02';
  const SUBJ_SUMMARY_EVENTS_TOTAL = `${SUBJ_SUMMARY_02} eventsTotal`;
  const SUBJ_SUMMARY_EVENTS_EMITTED = `${SUBJ_SUMMARY_02} eventsEmitted`;
  const SUBJ_SUMMARY_EVENTS_DROPPED = `${SUBJ_SUMMARY_02} eventsDropped`;
  const SUBJ_SUMMARY_BYTES_WRITTEN = `${SUBJ_SUMMARY_02} bytesWritten`;

  return new class BeatDetail {

    async isOnDetail() {
      const pageId = await retry.try(() => testSubjects.find(SUBJ_DETAIL_PAGE));
      return pageId !== null;
    }

    async getSummary() {
      return {
        name: await testSubjects.getVisibleText(SUBJ_SUMMARY_NAME),
        version: await testSubjects.getVisibleText(SUBJ_SUMMARY_VERSION),
        type: await testSubjects.getVisibleText(SUBJ_SUMMARY_TYPE),
        host: await testSubjects.getVisibleText(SUBJ_SUMMARY_HOST),
        output: await testSubjects.getVisibleText(SUBJ_SUMMARY_OUTPUT),
        configReloads: await testSubjects.getVisibleText(SUBJ_SUMMARY_CONFIG_RELOADS),
        uptime: await testSubjects.getVisibleText(SUBJ_SUMMARY_UPTIME),
        eventsTotal: await testSubjects.getVisibleText(SUBJ_SUMMARY_EVENTS_TOTAL),
        eventsEmitted: await testSubjects.getVisibleText(SUBJ_SUMMARY_EVENTS_EMITTED),
        eventsDropped: await testSubjects.getVisibleText(SUBJ_SUMMARY_EVENTS_DROPPED),
        bytesWritten: await testSubjects.getVisibleText(SUBJ_SUMMARY_BYTES_WRITTEN),
      };
    }

  };
}
