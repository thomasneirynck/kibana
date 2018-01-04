import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const overview = getService('monitoringClusterOverview');
  const nodesList = getService('monitoringElasticsearchNodes');
  const esClusterSummaryStatus = getService('monitoringElasticsearchSummaryStatus');

  describe('monitoring/elasticsearch-nodes', () => {

    const archive = 'monitoring/singlecluster-three-nodes-shard-relocation';
    const timeRange = {
      from: '2017-10-05 20:31:48.354',
      to: '2017-10-05 20:35:12.176',
    };

    before(async () => {
      await setup(archive, timeRange);

      // go to nodes listing
      await overview.clickEsNodes();
      expect(await nodesList.isOnListing()).to.be(true);
    });

    after(async () => {
      await tearDown(archive);
    });

    it('Elasticsearch Cluster Summary Status shows correct info', async () => {
      expect(await esClusterSummaryStatus.getContent()).to.eql({
        nodesCount: '3',
        indicesCount: '20',
        memory: '575MB / 2GB',
        totalShards: '80',
        unassignedShards: '5',
        documentCount: '25,927',
        dataSize: '102MB',
        health: 'Health: yellow',
      });
    });

  });
}
