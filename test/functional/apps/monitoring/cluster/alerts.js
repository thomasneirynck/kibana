import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const alerts = getService('monitoringClusterAlerts');
  const indices = getService('monitoringElasticsearchIndices');

  describe('monitoring/cluster-alerts', () => {
    before(() => {
      remote.setWindowSize(1600, 1000);
    });

    describe('cluster has single alert', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum');
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

      it('in alerts panel, a single medium alert is shown', async () => {
        const clusterAlerts = await alerts.getOverviewAlerts();
        expect(clusterAlerts.length).to.be(1);

        const { alertIcon, alertText } = await alerts.getOverviewAlert(0);
        expect(alertIcon).to.be('severity level: medium');
        expect(alertText).to.be('Elasticsearch cluster status is yellow. Allocate missing replica shards.');
      });
    });

    describe('cluster has 10 alerts', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum--with-10-alerts');
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
        const clusterAlerts = await alerts.getOverviewAlerts();
        expect(clusterAlerts.length).to.be(3);

        // check the all data in the panel
        const panelData = [
          {
            alertIcon: 'severity level: high',
            alertText: 'One cannot step twice in the same river. Heraclitus (ca. 540 – ca. 480 BCE)'
          },
          {
            alertIcon: 'severity level: high',
            alertText: 'Quality is not an act, it is a habit. Aristotle (384-322 BCE)'
          },
          {
            alertIcon: 'severity level: high',
            alertText: (
              'Life contains but two tragedies. One is not to get your heart’s desire; the other is to get it. Socrates (470-399 BCE)'
            )
          },
        ];

        const alertsAll = await alerts.getOverviewAlertsAll();

        alertsAll.forEach((obj, index) => {
          expect(alertsAll[index].alertIcon).to.be(panelData[index].alertIcon);
          expect(alertsAll[index].alertText).to.be(panelData[index].alertText);
        });

      });

      it('in alerts table view, all alerts are shown', async () => {
        await alerts.clickViewAll();
        expect(await alerts.isOnListingPage()).to.be(true);

        const rows = await alerts.getTableAlerts();
        expect(rows.length).to.be(10);

        // check the all data in the table
        const tableData = [
          {
            alertIcon: 'severity level: high',
            alertText: 'One cannot step twice in the same river. Heraclitus (ca. 540 – ca. 480 BCE)'
          },
          {
            alertIcon: 'severity level: high',
            alertText: 'Quality is not an act, it is a habit. Aristotle (384-322 BCE)'
          },
          {
            alertIcon: 'severity level: high',
            alertText: (
              'Life contains but two tragedies. One is not to get your heart’s desire; the other is to get it. Socrates (470-399 BCE)'
            )
          },
          {
            alertIcon: 'severity level: high',
            alertText: 'The owl of Minerva spreads its wings only with the falling of the dusk. G.W.F. Hegel (1770 – 1831)'
          },
          {
            alertIcon: 'severity level: medium',
            alertText: 'We live in the best of all possible worlds. Gottfried Wilhelm Leibniz (1646 – 1716)'
          },
          {
            alertIcon: 'severity level: medium',
            alertText: 'To be is to be perceived (Esse est percipi). Bishop George Berkeley (1685 – 1753)'
          },
          {
            alertIcon: 'severity level: medium',
            alertText: 'I think therefore I am. René Descartes (1596 – 1650)'
          },
          {
            alertIcon: 'severity level: low',
            alertText: 'The life of man [is] solitary, poor, nasty, brutish, and short. Thomas Hobbes (1588 – 1679)'
          },
          {
            alertIcon: 'severity level: low',
            alertText: 'Entities should not be multiplied unnecessarily. William of Ockham (1285 - 1349?)'
          },
          {
            alertIcon: 'severity level: low',
            alertText: 'The unexamined life is not worth living. Socrates (470-399 BCE)'
          },
        ];

        const alertsAll = await alerts.getTableAlertsAll();

        alertsAll.forEach((obj, index) => {
          expect(alertsAll[index].alertIcon).to.be(tableData[index].alertIcon);
          expect(alertsAll[index].alertText).to.be(tableData[index].alertText);
        });

        await PageObjects.monitoring.clickBreadcrumb('breadcrumbClusters');
      });
    });

    describe('alert actions take you to the elasticsearch indices listing', async () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum');
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

      it('with alert on overview', async () => {
        const { alertAction } = await alerts.getOverviewAlert(0);
        await alertAction.click();
        expect(await indices.isOnListing()).to.be(true);

        await PageObjects.monitoring.clickBreadcrumb('breadcrumbClusters');
      });

      it('with alert on listing table page', async () => {
        await alerts.clickViewAll();
        expect(await alerts.isOnListingPage()).to.be(true);

        const { alertAction } = await alerts.getTableAlert(0);
        await alertAction.click();
        expect(await indices.isOnListing()).to.be(true);

        await PageObjects.monitoring.clickBreadcrumb('breadcrumbClusters');
      });
    });

  });
}
