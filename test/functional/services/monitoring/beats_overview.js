export function MonitoringBeatsOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'beatsOverviewPage';

  const SUBJ_NO_RECENT_ACTIVITY_MESSAGE = 'noRecentActivityMessage';

  return new class BeatsOverview {

    async isOnOverview() {
      const pageId = await retry.try(() => testSubjects.find(SUBJ_OVERVIEW_PAGE));
      return pageId !== null;
    }

    noRecentActivityMessageIsShowing() {
      return testSubjects.exists(SUBJ_NO_RECENT_ACTIVITY_MESSAGE);
    }

  };
}
