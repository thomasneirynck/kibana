import expect from 'expect.js';
import { getLifecycleMethods } from '../_get_lifecycle_methods';

export default function ({ getService, getPageObjects }) {
  const clusterOverview = getService('monitoringClusterOverview');
  const listing = getService('monitoringBeatsListing');
  const beatsSummaryStatus = getService('monitoringBeatsSummaryStatus');

  describe.skip('monitoring/beats-listing', () => {
    const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

    before(async () => {
      await setup('monitoring/beats', {
        from: '2017-12-19 17:14:09',
        to: '2017-12-19 18:15:09',
      });

      // go to beats listing
      await clusterOverview.clickBeatsListing();
      expect(await listing.isOnListing()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('cluster status bar shows correct information', async () => {
      expect(await beatsSummaryStatus.getContent()).to.eql({
        filebeat: 200,
        heartbeat: 100,
        metricbeat: 100,
        cowbeat: 1,
        duckbeat: 1,
        sheepbeat: 1,
        winlogbeat: 1,
        totalEvents: '699.9k',
        bytesSent: '428MB',
      });
    });

  });
}
