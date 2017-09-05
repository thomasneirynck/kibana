import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const clusterList = getService('monitoringClusterList');
  const PageObjects = getPageObjects(['monitoring', 'header']);

  describe('monitoring/cluster-list', () => {
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
        const basicClusterLink = await clusterList.getClusterLink('unsupportedLicenseCluster');
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
}
