import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const listing = getService('monitoringBeatsListing');
  const detail = getService('monitoringBeatDetail');

  describe('monitoring/beat-detail', () => {

    before(async () => {
      await setup();

      // go to beats detail
      await clusterOverview.clickBeatsListing();
      expect(await listing.isOnListing()).to.be(true);

      await listing.clearFilter();
      await listing.setFilter('duckbeat'); // filter for a beat type that has only 1 instance
      await listing.clickRowByName('tsullivan.local-1-17');
    });

    after(async () => {
      await tearDown();
    });

    it('cluster status bar shows correct information', async () => {
      expect(await detail.getSummary()).to.eql({
        name: 'tsullivan.local-1-17',
        version: '7.0.0-alpha1',
        type: 'Duckbeat',
        host: 'tsullivan.local',
        output: 'Elasticsearch',
        configReloads: 0,
        uptime: '6 minutes',
        eventsPublished: 17,
        eventsEmitted: 17,
        eventsDropped: 0,
        bytesWritten: '18KB',
      });
    });

  });
}
