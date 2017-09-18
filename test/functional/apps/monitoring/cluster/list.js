import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const clusterList = getService('monitoringClusterList');
  const clusterOverview = getService('monitoringClusterOverview');
  const PageObjects = getPageObjects(['monitoring', 'header']);

  describe('monitoring/cluster-list', () => {
    describe('with trial license clusters', () => {
      const UNSUPPORTED_CLUSTER_UUID = '6d-9tDFTRe-qT5GoBytdlQ';

      before(async () => {
        await esArchiver.load('monitoring/multicluster');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });
        remote.setWindowSize(1600, 1000);

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-15 22:02:57.743';
        const toTime = '2017-08-15 22:10:32.845';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);

        await clusterList.assertDefaults();
      });

      after(async () => {
        await esArchiver.unload('monitoring/multicluster');
      });

      afterEach(async () => {
        await clusterList.clearFilter();
      });

      describe('cluster table and toolbar', () => {
        it('shows 3 clusters sorted by name', async () => {
          const rows = await clusterList.getRows();
          expect(rows.length).to.be(3);
        });

        it('filters for a single cluster', async () => {
          await clusterList.setFilter('clusterone');
          const rows = await clusterList.getRows();
          expect(rows.length).to.be(1);
        });

        it('filters for non-existent cluster', async () => {
          await clusterList.setFilter('foobar');
          await clusterList.assertNoData();
        });
      });

      describe('cluster row actions', () => {
        it('clicking the basic cluster shows a toast message', async () => {
          const basicClusterLink = await clusterList.getClusterLink(UNSUPPORTED_CLUSTER_UUID);
          await basicClusterLink.click();

          const actualMessage = await PageObjects.header.getToastMessage();
          const expectedMessage = (
`You can't view the "clustertwo" cluster because the Basic license does not support multi-cluster monitoring.
Need to monitor multiple clusters? Get a license with full functionality to enjoy multi-cluster monitoring.`
          );
          expect(actualMessage).to.be(expectedMessage);
          await PageObjects.header.clickToastOK();
        });

        /*
         * TODO: When the licenses of the Trial clusters expire, add license expiration tests
         * (Trial licenses expire 2017-09-14)
         */
      });
    });

    describe('with all basic license clusters', () => {
      const UNSUPPORTED_CLUSTER_UUID = 'kH7C358oRzK6bmNzTeLEug';
      const SUPPORTED_CLUSTER_UUID = 'NDKg6VXAT6-TaGzEK2Zy7g';

      before(async () => {
        await esArchiver.load('monitoring/multi-basic');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });
        remote.setWindowSize(1600, 1000);

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-09-07 20:12:04.011';
        const toTime = '2017-09-07 20:18:55.733';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);

        await clusterList.assertDefaults();
      });

      after(async () => {
        await esArchiver.unload('monitoring/multi-basic');
      });

      describe('cluster row content', () => {
        it('non-primary basic cluster shows N/A for everything', async () => {
          expect(await clusterList.getClusterName(UNSUPPORTED_CLUSTER_UUID)).to.be('staging');
          expect(await clusterList.getClusterStatus(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterNodesCount(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterIndicesCount(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterDataSize(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterLogstashCount(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterKibanaCount(UNSUPPORTED_CLUSTER_UUID)).to.be('-');
          expect(await clusterList.getClusterLicense(UNSUPPORTED_CLUSTER_UUID)).to.be('Basic\nExpires 29 Aug 30');
        });

        it('primary basic cluster shows cluster metrics', async () => {
          expect(await clusterList.getClusterName(SUPPORTED_CLUSTER_UUID)).to.be('production');
          expect(await clusterList.getClusterStatus(SUPPORTED_CLUSTER_UUID)).to.be('N/A');
          expect(await clusterList.getClusterNodesCount(SUPPORTED_CLUSTER_UUID)).to.be('2');
          expect(await clusterList.getClusterIndicesCount(SUPPORTED_CLUSTER_UUID)).to.be('4');
          expect(await clusterList.getClusterDataSize(SUPPORTED_CLUSTER_UUID)).to.be('1.6 MB');
          expect(await clusterList.getClusterLogstashCount(SUPPORTED_CLUSTER_UUID)).to.be('2');
          expect(await clusterList.getClusterKibanaCount(SUPPORTED_CLUSTER_UUID)).to.be('1');
          expect(await clusterList.getClusterLicense(SUPPORTED_CLUSTER_UUID)).to.be('Basic\nExpires 29 Aug 30');
        });
      });

      describe('cluster row actions', () => {
        it('clicking the non-primary basic cluster shows a toast message', async () => {
          const basicClusterLink = await clusterList.getClusterLink(UNSUPPORTED_CLUSTER_UUID);
          await basicClusterLink.click();

          const actualMessage = await PageObjects.header.getToastMessage();
          const expectedMessage = (
`You can't view the "staging" cluster because the Basic license does not support multi-cluster monitoring.
Need to monitor multiple clusters? Get a license with full functionality to enjoy multi-cluster monitoring.`
          );
          expect(actualMessage).to.be(expectedMessage);
          await PageObjects.header.clickToastOK();
        });

        it('clicking the primary basic cluster goes to overview', async () => {
          const primaryBasicClusterLink = await clusterList.getClusterLink(SUPPORTED_CLUSTER_UUID);
          await primaryBasicClusterLink.click();

          expect(await clusterOverview.isOnClusterOverview()).to.be(true);
          expect(await clusterOverview.getClusterName()).to.be('production');

          await PageObjects.monitoring.clickBreadcrumb('breadcrumbClusters'); // reset for next test
        });

      });
    });
  });
}
