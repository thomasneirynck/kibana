export function MonitoringBeatsSummaryStatusProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_SUMMARY = 'beatsSummaryStatus';
  const SUBJ_TYPES_COUNTS = `${SUBJ_SUMMARY} typeCount`;

  const SUBJ_TOTAL_EVENTS   = `${SUBJ_SUMMARY} totalEvents`;
  const SUBJ_BYTES_SENT = `${SUBJ_SUMMARY} bytesSent`;

  return new class BeatsSummaryStatus {

    async getContent() {
      const counts = await testSubjects.getAttributeAll(SUBJ_TYPES_COUNTS, 'data-test-type-count');

      const countsByType = counts.reduce((accum, text) => {
        const [ type, count ] = text.split(':');
        return {
          ...accum,
          [type.toLowerCase()]: count
        };
      }, {});

      return {
        ...countsByType,
        totalEvents: await testSubjects.getVisibleText(SUBJ_TOTAL_EVENTS),
        bytesSent: await testSubjects.getVisibleText(SUBJ_BYTES_SENT),
      };
    }

  };
}
