import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const overview = getService('monitoringClusterOverview');

  describe('monitoring/beats-cluster', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/beats', {
        from: '2017-12-19 17:14:09',
        to: '2017-12-19 18:15:09',
      });
    });

    after(async () => {
      await tearDown();
    });

    it('shows beats panel with data', async () => {
      expect(await overview.getBeatsTotalEventsRate()).to.be('699.9k');
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
