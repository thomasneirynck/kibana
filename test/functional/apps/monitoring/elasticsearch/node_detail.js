import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const nodesList = getService('monitoringElasticsearchNodes');
  const nodeDetail = getService('monitoringElasticsearchNodeDetail');

  const setup = async (archive, { from, to }) => {
    await remote.setWindowSize(1600, 1000);

    await esArchiver.load(archive);
    await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

    await PageObjects.monitoring.navigateTo();
    await PageObjects.monitoring.getNoDataMessage();

    await PageObjects.header.setAbsoluteRange(from, to);

    // go to nodes listing
    await overview.clickEsNodes();
    expect(await nodesList.isOnListing()).to.be(true);
  };
  const tearDown = async archive => {
    await esArchiver.unload(archive);
  };

  describe('monitoring/elasticsearch-node-detail', () => {

    describe('Active Nodes', () => {
      const archive = 'monitoring/singlecluster-three-nodes-shard-relocation';
      const timeRange = { from: '2017-10-05 20:31:48.354', to: '2017-10-05 20:35:12.176' };

      before(async () => {
        await setup(archive, timeRange);
      });

      after(async () => {
        await tearDown(archive);
      });

      afterEach(async () => {
        await PageObjects.monitoring.clickBreadcrumb('breadcrumbEsNodes'); // return back for next test
      });

      it('master node with 20 indices / 38 shards', async () => {
        await nodesList.clickRowByResolver('jUT5KdxfRbORSCWkb5zjmA');

        expect(await nodeDetail.getSummary()).to.eql({
          transportAddress: '127.0.0.1:9300',
          jvmHeap: 'JVM Heap: 29 %',
          freeDiskSpace: 'Free Disk Space: 173.9 GB',
          documentCount: 'Documents: 24.8k',
          dataSize: 'Data: 50.4 MB',
          indicesCount: 'Indices: 20',
          shardsCount: 'Shards: 38',
          nodeType: 'Type: Master Node',
          status: 'Health: Online',
        });
      });

      it('data node with 4 indices / 4 shards', async () => {
        await nodesList.clickRowByResolver('bwQWH-7IQY-mFPpfoaoFXQ');

        expect(await nodeDetail.getSummary()).to.eql({
          transportAddress: '127.0.0.1:9302',
          jvmHeap: 'JVM Heap: 17 %',
          freeDiskSpace: 'Free Disk Space: 173.9 GB',
          documentCount: 'Documents: 240',
          dataSize: 'Data: 1.4 MB',
          indicesCount: 'Indices: 4',
          shardsCount: 'Shards: 4',
          nodeType: 'Type: Node',
          status: 'Health: Online',
        });
      });
    });

    describe('Offline Node', () => {
      const archive = 'monitoring/singlecluster-red-platinum';
      const timeRange = { from: '2017-10-06 19:53:06.748', to: '2017-10-06 20:15:30.212' };

      before(async () => {
        await setup(archive, timeRange);
      });

      after(async () => {
        await tearDown(archive);
      });

      it('shows N/A', async () => {
        await nodesList.clickRowByResolver('1jxg5T33TWub-jJL4qP0Wg');

        expect(await nodeDetail.getSummary()).to.eql({
          transportAddress: '127.0.0.1:9302',
          jvmHeap: 'JVM Heap: N/A',
          freeDiskSpace: 'Free Disk Space: N/A',
          documentCount: 'Documents: N/A',
          dataSize: 'Data: N/A',
          indicesCount: 'Indices: N/A',
          shardsCount: 'Shards: N/A',
          nodeType: 'Type: Offline Node',
          status: 'Health: Offline',
        });
      });
    });

  });
}
