export function MonitoringBeatsListingProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const retry = getService('retry');
  const PageObjects = getPageObjects(['monitoring']);

  const SUBJ_LISTING_PAGE = 'beatsListingPage';

  const SUBJ_NO_RECENT_ACTIVITY_MESSAGE = 'noRecentActivityMessage';

  const SUBJ_TABLE_CONTAINER   = 'beatsTableContainer';
  const SUBJ_SEARCH_BAR        = `${SUBJ_TABLE_CONTAINER} monitoringTableToolBar`;
  const SUBJ_TABLE_BODY        = 'beatsTableBody';
  const SUBJ_INDEX_LINK_PREFIX = `${SUBJ_TABLE_BODY} beatLink-`;

  return new class BeatsListing {

    isOnListing() {
      return retry.try(() => testSubjects.exists(SUBJ_LISTING_PAGE));
    }

    noRecentActivityMessageIsShowing() {
      return testSubjects.exists(SUBJ_NO_RECENT_ACTIVITY_MESSAGE);
    }

    setFilter(text) {
      return PageObjects.monitoring.tableSetFilter(SUBJ_SEARCH_BAR, text);
    }

    clearFilter() {
      return PageObjects.monitoring.tableClearFilter(SUBJ_SEARCH_BAR);
    }

    clickRowByName(beatName) {
      return testSubjects.click(SUBJ_INDEX_LINK_PREFIX + beatName);
    }

  };
}
