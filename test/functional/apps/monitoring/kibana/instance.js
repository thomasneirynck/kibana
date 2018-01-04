import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const instances = getService('monitoringKibanaInstances');
  const instance = getService('monitoringKibanaInstance');

  describe('monitoring/kibana-instance', () => {

    before(async () => {
      await setup();

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
