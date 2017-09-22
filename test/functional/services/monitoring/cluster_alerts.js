export function MonitoringClusterAlertsProvider({ getService }) {
  const testSubjects = getService('testSubjects');

  const SUBJ_CLUSTER_ALERTS       = `clusterAlertsContainer`;
  const SUBJ_VIEW_ALL       = `${SUBJ_CLUSTER_ALERTS} viewAllAlerts`;

  return new class ClusterAlerts {

    async getClusterAlerts() {
      return await testSubjects.findAll(`${SUBJ_CLUSTER_ALERTS} topAlertItem`);
    }
    async getClusterAlert(index) {
      const alerts = await this.getClusterAlerts();
      const alert = alerts[index];

      const alertIcon = await testSubjects.findDescendant('alertIcon', alert);
      const alertText = await testSubjects.findDescendant('alertTextMessage', alert);
      // const alertMeta = await testSubjects.findDescendant('alertTextMeta', alert); // FIXME can't use this for assertions since time is relative

      return {
        alertIcon: await alertIcon.getProperty('alt'),
        alertText: await alertText.getVisibleText(),
      };
    }
    async clickViewAllAlerts() {
      const viewAllLink = await testSubjects.find(SUBJ_VIEW_ALL);
      return viewAllLink.click();
    }

  };
}

