import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const indicesList = getService('monitoringElasticsearchIndices');
  const indexDetail = getService('monitoringElasticsearchIndexDetail');

  const setup = async (archive, { from, to }) => {
    await remote.setWindowSize(1600, 1000);

    await esArchiver.load(archive);
    await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

    await PageObjects.monitoring.navigateTo();
    await PageObjects.monitoring.getNoDataMessage();

    await PageObjects.header.setAbsoluteRange(from, to);

    // go to indices listing
    await overview.clickEsIndices();
    expect(await indicesList.isOnListing()).to.be(true);
  };
  const tearDown = async archive => {
    await esArchiver.unload(archive);
  };

  describe('monitoring/elasticsearch-index-detail', () => {

    afterEach(async () => {
      await PageObjects.monitoring.clickBreadcrumb('breadcrumbEsIndices'); // return back for next test
      await indicesList.clearFilter();
    });

    describe('Active Indices', () => {
      const archive = 'monitoring/singlecluster-three-nodes-shard-relocation';
      const timeRange = { from: '2017-10-05 20:31:48.354', to: '2017-10-05 20:35:12.176' };

      before(async () => {
        await setup(archive, timeRange);
      });

      after(async () => {
        await tearDown(archive);
      });

      it('green status index with full shard allocation', async () => {
        await indicesList.clickRowByName('avocado-tweets-2017.10.02');

        expect(await indexDetail.getSummary()).to.eql({
          dataSize: 'Total: 8.8 MB',
          dataSizePrimaries: 'Primaries: 4.4 MB',
          documentCount: 'Documents: 628',
          totalShards: 'Total Shards: 10',
          unassignedShards: 'Unassigned Shards: 0',
          health: 'Health: green',
        });
      });

      it('green status index with single relocating shard', async () => {
        await indicesList.clickRowByName('relocation_test');

        expect(await indexDetail.getSummary()).to.eql({
          dataSize: 'Total: 4.8 KB',
          dataSizePrimaries: 'Primaries: 4.8 KB',
          documentCount: 'Documents: 1',
          totalShards: 'Total Shards: 1',
          unassignedShards: 'Unassigned Shards: 0',
          health: 'Health: green',
        });
      });

      it('yellow status index with single unallocated shard', async () => {
        await indicesList.clickRowByName('phone-home');

        expect(await indexDetail.getSummary()).to.eql({
          dataSize: 'Total: 1.2 MB',
          dataSizePrimaries: 'Primaries: 657.6 KB',
          documentCount: 'Documents: 10',
          totalShards: 'Total Shards: 10',
          unassignedShards: 'Unassigned Shards: 1',
          health: 'Health: yellow',
        });
      });
    });

    describe('Deleted Index', () => {
      const archive = 'monitoring/singlecluster-red-platinum';
      const timeRange = { from: '2017-10-06 19:53:06.748', to: '2017-10-06 20:15:30.212' };

      before(async () => {
        await setup(archive, timeRange);
      });

      after(async () => {
        await tearDown(archive);
      });

      it('shows N/A', async () => {
        await indicesList.setFilter('deleted');
        await indicesList.clickRowByName('many-0001_clruksahirti');

        expect(await indexDetail.getSummary()).to.eql({
          dataSize: 'Total: 3.6 KB',
          dataSizePrimaries: 'Primaries: 3.6 KB',
          documentCount: 'Documents: 1',
          totalShards: 'Total Shards: N/A',
          unassignedShards: 'Unassigned Shards: N/A',
          health: 'Health: Not Available',
        });
      });
    });

  });
}
