import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {

  const clusterOverview = getService('monitoringClusterOverview');
  const overview = getService('monitoringElasticsearchOverview');
  const esClusterSummaryStatus = getService('monitoringElasticsearchSummaryStatus');

  describe('monitoring/elasticsearch-overview', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/singlecluster-three-nodes-shard-relocation', {
        from: '2017-10-05 20:31:48.354',
        to: '2017-10-05 20:35:12.176',
      });

      // go to overview
      await clusterOverview.clickEsOverview();
      expect(await overview.isOnOverview()).to.be(true);
    });

    after(async () => {
      await tearDown();
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
