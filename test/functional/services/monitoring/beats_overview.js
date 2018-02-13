export function MonitoringBeatsOverviewProvider({ getService }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');

  const SUBJ_OVERVIEW_PAGE = 'beatsOverviewPage';

  const SUBJ_NO_RECENT_ACTIVITY_MESSAGE = 'noRecentActivityMessage';

  return new class BeatsOverview {

    isOnOverview() {
      return retry.try(() => testSubjects.exists(SUBJ_OVERVIEW_PAGE));
    }

    noRecentActivityMessageIsShowing() {
      return testSubjects.exists(SUBJ_NO_RECENT_ACTIVITY_MESSAGE);
    }

  };
}
