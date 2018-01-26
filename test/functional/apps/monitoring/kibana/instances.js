import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const clusterOverview = getService('monitoringClusterOverview');
  const instances = getService('monitoringKibanaInstances');
  const kibanaClusterSummaryStatus = getService('monitoringKibanaSummaryStatus');

  describe('monitoring/kibana-instances', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/singlecluster-yellow-platinum', {
        from: '2017-08-29 17:24:14.254',
        to: '2017-08-29 17:25:44.142',
      });

      // go to kibana instances
      await clusterOverview.clickKibanaInstances();
      expect(await instances.isOnInstances()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('Kibana Cluster Summary Status shows correct info', async () => {
      expect(await kibanaClusterSummaryStatus.getContent()).to.eql({
        instances: '1',
        memory: '220MB / 1GB',
        requests: '172',
        connections: '162',
        maxResponseTime: '2203 ms',
        health: 'Health: green',
      });
    });

  });
}
