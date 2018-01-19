import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const overview = getService('monitoringClusterOverview');

  describe('monitoring/beats-cluster', () => {

    before(async () => {
      await setup();
    });

    after(async () => {
      await tearDown();
    });

    it('shows beats panel with data', async () => {
      expect(await overview.getBeatsPublishedEventsRate()).to.be('699.9k');
      expect(await overview.getBeatsTotalBytesSentRate()).to.be('428MB');
      expect(await overview.getBeatsListingDetail()).to.eql({
        total: 404,
        types: {
          filebeat: 200,
          heartbeat: 100,
          metricbeat: 100,
          cowbeat: 1,
          duckbeat: 1,
          sheepbeat: 1,
          winlogbeat: 1,
        }
      });
    });

  });
}
