import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const instances = getService('monitoringKibanaInstances');
  const kibanaClusterSummaryStatus = getService('monitoringKibanaSummaryStatus');

  describe('monitoring/kibana-instances', () => {

    before(async () => {
      await setup();

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
