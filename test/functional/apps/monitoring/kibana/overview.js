import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const clusterOverview = getService('monitoringClusterOverview');
  const overview = getService('monitoringKibanaOverview');
  const kibanaClusterSummaryStatus = getService('monitoringKibanaSummaryStatus');

  describe('monitoring/kibana-overview', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/singlecluster-yellow-platinum', {
        from: '2017-08-29 17:24:14.254',
        to: '2017-08-29 17:25:44.142',
      });

      // go to kibana overview
      await clusterOverview.clickKibanaOverview();
      expect(await overview.isOnOverview()).to.be(true);
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
