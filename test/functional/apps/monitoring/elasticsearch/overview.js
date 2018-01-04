import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const overview = getService('monitoringElasticsearchOverview');
  const esClusterSummaryStatus = getService('monitoringElasticsearchSummaryStatus');

  describe('monitoring/elasticsearch-overview', () => {

    const archive = 'monitoring/singlecluster-three-nodes-shard-relocation';
    const timeRange = {
      from: '2017-10-05 20:31:48.354',
      to: '2017-10-05 20:35:12.176',
    };

    before(async () => {
      await setup(archive, timeRange);

      // go to overview
      await clusterOverview.clickEsOverview();
      expect(await overview.isOnOverview()).to.be(true);
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
