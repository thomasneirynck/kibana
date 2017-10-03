import { range } from 'lodash';

export function MonitoringClusterAlertsProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['monitoring']);

  const SUBJ_OVERVIEW_CLUSTER_ALERTS = `clusterAlertsContainer`;
  const SUBJ_OVERVIEW_ICONS          = `${SUBJ_OVERVIEW_CLUSTER_ALERTS} alertIcon`;
  const SUBJ_OVERVIEW_TEXTS          = `${SUBJ_OVERVIEW_CLUSTER_ALERTS} alertText`;
  const SUBJ_OVERVIEW_ACTIONS        = `${SUBJ_OVERVIEW_CLUSTER_ALERTS} alertAction`;
  const SUBJ_OVERVIEW_VIEW_ALL       = `${SUBJ_OVERVIEW_CLUSTER_ALERTS} viewAllAlerts`;

  const SUBJ_LISTING_PAGE  = 'clusterAlertsListingPage';
  const SUBJ_TABLE_BODY    = 'alertsTableBody';
  const SUBJ_TABLE_ICONS   = `${SUBJ_TABLE_BODY} alertIcon`;
  const SUBJ_TABLE_TEXTS   = `${SUBJ_TABLE_BODY} alertText`;
  const SUBJ_TABLE_ACTIONS = `${SUBJ_TABLE_BODY} alertAction`;

  return new class ClusterAlerts {

    /*
     * Helper function to return the testable panel listing content or table content
     */
    async _getAlertSetAll({ iconsSubj, textsSubj, actionsSubj, size }) {
      const alertIcons = await testSubjects.getPropertyAll(iconsSubj, 'alt');
      const alertTexts = await testSubjects.getVisibleTextAll(textsSubj);
      const alertActions = await testSubjects.findAll(actionsSubj);

      // tuple-ize the icons and texts together into an array of objects
      const iterator = range(size);
      return iterator.reduce((all, current) => {
        return [
          ...all,
          {
            alertIcon: alertIcons[current],
            alertText: alertTexts[current],
            alertAction: alertActions[current]
          }
        ];
      }, []);
    }

    /*
     * Cluster Overview Page
     */

    async getOverviewAlerts() {
      return testSubjects.findAll(`${SUBJ_OVERVIEW_CLUSTER_ALERTS} topAlertItem`);
    }

    async getOverviewAlertsAll() {
      const listingRows = await this.getOverviewAlerts();
      return await this._getAlertSetAll({
        size: listingRows.length,
        iconsSubj: SUBJ_OVERVIEW_ICONS,
        textsSubj: SUBJ_OVERVIEW_TEXTS,
        actionsSubj: SUBJ_OVERVIEW_ACTIONS
      });
    }

    async getOverviewAlert(index) {
      const alerts = await this.getOverviewAlertsAll();
      return alerts[index];
    }

    async clickViewAll() {
      return testSubjects.click(SUBJ_OVERVIEW_VIEW_ALL);
    }

    /*
     * Cluster Alerts Table
     */

    async isOnListingPage() {
      return testSubjects.exists(SUBJ_LISTING_PAGE);
    }

    async getTableAlerts() {
      return await PageObjects.monitoring.tableGetRows(SUBJ_TABLE_BODY);
    }

    async getTableAlertsAll() {
      const tableRows = await this.getTableAlerts();
      return await this._getAlertSetAll({
        size: tableRows.length,
        iconsSubj: SUBJ_TABLE_ICONS,
        textsSubj: SUBJ_TABLE_TEXTS,
        actionsSubj: SUBJ_TABLE_ACTIONS
      });
    }

    async getTableAlert(index) {
      const alerts = await this.getTableAlertsAll();
      return alerts[index];
    }

  };
}

