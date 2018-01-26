import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const clusterOverview = getService('monitoringClusterOverview');
  const instances = getService('monitoringKibanaInstances');
  const instance = getService('monitoringKibanaInstance');

  describe('monitoring/kibana-instance', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/singlecluster-yellow-platinum', {
        from: '2017-08-29 17:24:14.254',
        to: '2017-08-29 17:25:44.142',
      });

      // go to kibana instance
      await clusterOverview.clickKibanaInstances();
      expect(await instances.isOnInstances()).to.be(true);

      await instances.clickRowByName('tsullivan.local');

      expect(await instance.isOnInstance()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('Kibana Instance Summary Status shows correct info', async () => {
      expect(await instance.getSummary()).to.eql({
        transportAddress: 'tsullivan.local:5601',
        osFreeMemory: '1.5 GB',
        version: '7.0.0-alpha1',
        uptime: '3 minutes',
        health: 'Health: green',
      });
    });

  });
}
