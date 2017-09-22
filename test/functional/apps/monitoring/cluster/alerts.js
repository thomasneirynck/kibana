import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const alerts = getService('monitoringClusterAlerts');

  describe('monitoring/cluster-alerts', () => {
    before(() => {
      remote.setWindowSize(1600, 1000);
    });

    describe('single alert is shown', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-29 17:23:47.528';
        const toTime = '2017-08-29 17:25:50.701';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);

        // ensure cluster alerts are shown on overview
        expect(await overview.doesClusterAlertsExist()).to.be(true);
      });

      after(async () => {
        await esArchiver.unload('monitoring/singlecluster-yellow-platinum');
      });

      it('in alerts panel, medium alert is shown', async () => {
        const clusterAlerts = await alerts.getClusterAlerts();
        expect(clusterAlerts.length).to.be(1);

        const { alertIcon, alertText } = await alerts.getClusterAlert(0);
        expect(alertIcon).to.be('severity level: medium');
        expect(alertText).to.be('Elasticsearch cluster status is yellow. Allocate missing replica shards.');
      });
    });

    describe('cluster overview page truncates the alerts to show the top 3', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum--with-10-alerts');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-29 17:23:47.528';
        const toTime = '2017-08-29 17:25:50.701';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);

        // ensure cluster alerts are shown on overview
        expect(await overview.doesClusterAlertsExist()).to.be(true);
      });

      after(async () => {
        await esArchiver.unload('monitoring/singlecluster-yellow-platinum--with-10-alerts');
      });

      it('in alerts panel, top 3 alerts are shown', async () => {
        const clusterAlerts = await alerts.getClusterAlerts();
        expect(clusterAlerts.length).to.be(3);

        (async () => {
          const { alertIcon, alertText } = await alerts.getClusterAlert(0);
          expect(alertIcon).to.be('severity level: high');
          expect(alertText).to.be('One cannot step twice in the same river. Heraclitus (ca. 540 – ca. 480 BCE)');
        })();
        (async () => {
          const { alertIcon, alertText } = await alerts.getClusterAlert(1);
          expect(alertIcon).to.be('severity level: high');
          expect(alertText).to.be('Quality is not an act, it is a habit. Aristotle (384-322 BCE)');
        })();
        (async () => {
          const { alertIcon, alertText } = await alerts.getClusterAlert(2);
          expect(alertIcon).to.be('severity level: high');
          expect(alertText).to.be(
            'Life contains but two tragedies. One is not to get your heart’s desire; the other is to get it. Socrates (470-399 BCE)'
          );
        })();
      });

      it('in alerts table view, all alerts are shown', async () => {
        await alerts.clickViewAllAlerts();

        // TODO

        await PageObjects.monitoring.clickBreadcrumb('breadcrumbClusters'); // reset for next test
      });
    });

  });
}
