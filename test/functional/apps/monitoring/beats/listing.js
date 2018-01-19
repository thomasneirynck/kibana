import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const listing = getService('monitoringBeatsListing');
  const beatsSummaryStatus = getService('monitoringBeatsSummaryStatus');

  describe('monitoring/beats-listing', () => {

    before(async () => {
      await setup();

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
        publishedEvents: '699.9k',
        bytesSent: '428MB',
      });
    });

  });
}
