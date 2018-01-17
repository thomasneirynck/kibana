import expect from 'expect.js';
import { getLifecycleMethods } from './_common';

export default function ({ getService, getPageObjects }) {
  const { setup, tearDown } = getLifecycleMethods(getService, getPageObjects);

  const clusterOverview = getService('monitoringClusterOverview');
  const overview = getService('monitoringBeatsOverview');
  const beatsSummaryStatus = getService('monitoringBeatsSummaryStatus');

  describe('monitoring/beats-overview', () => {

    before(async () => {
      await setup();

      // go to beats overview
      await clusterOverview.clickBeatsOverview();
      expect(await overview.isOnOverview()).to.be(true);
    });

    after(async () => {
      await tearDown();
    });

    it('shows no recent activity', async () => {
      expect(await overview.noRecentActivityMessageIsShowing()).to.be(true);
    });

    it('cluster status bar shows correct information', async () => {
      expect(await beatsSummaryStatus.getContent()).to.eql({
        filebeat: 200,
        heartbeat: 100,
        metricbeat: 100,
        chickenbeat: 1,
        cowbeat: 1,
        duckbeat: 1,
        sheepbeat: 1,
        winlogbeat: 1,
        publishedEvents: '724k',
        bytesSent: '428MB',
      });
    });

  });
}
