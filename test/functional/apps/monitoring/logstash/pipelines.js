import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const pipelinesList = getService('monitoringLogstashPipelines');
  const lsClusterSummaryStatus = getService('monitoringLogstashSummaryStatus');

  const archiveId = 'monitoring/logstash-pipelines';

  describe('monitoring/logstash-pipelines', () => {
    before(async () => {
      await remote.setWindowSize(1600, 1000);

      await esArchiver.load(archiveId);
      const fromTime = '2018-01-22 9:10:00.000';
      const toTime = '2018-01-22 9:41:00.000';
      await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

      await PageObjects.monitoring.navigateTo();
      await PageObjects.monitoring.getNoDataMessage();

      await PageObjects.header.setAbsoluteRange(fromTime, toTime);

      // go to pipelines listing
      await overview.clickLsPipelines();
      expect(await pipelinesList.isOnListing()).to.be(true);
    });

    after(async () => {
      await esArchiver.unload(archiveId);
    });

    it('Logstash Cluster Summary Status shows correct info', async () => {
      expect(await lsClusterSummaryStatus.getContent()).to.eql({
        nodeCount: '2',
        memoryUsed: '528MB / 2GB',
        eventsInTotal: '117.9k',
        eventsOutTotal: '111.9k'
      });
    });

    it('Pipelines table shows correct rows with default sorting', async () => {
      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(4);

      const pipelinesAll = await pipelinesList.getPipelinesAll();

      const tableData = [
        { id: 'main', eventsEmittedRate: '108.3 e/s', nodeCount: '1' },
        { id: 'nginx_logs', eventsEmittedRate: '29.2 e/s', nodeCount: '1' },
        { id: 'test_interpolation', eventsEmittedRate: '0 e/s', nodeCount: '1' },
        { id: 'tweets_about_labradoodles', eventsEmittedRate: '0.6 e/s', nodeCount: '1' },
      ];

      // check the all data in the table
      pipelinesAll.forEach((obj, index) => {
        expect(pipelinesAll[index].id).to.be(tableData[index].id);
        expect(pipelinesAll[index].eventsEmittedRate).to.be(tableData[index].eventsEmittedRate);
        expect(pipelinesAll[index].nodeCount).to.be(tableData[index].nodeCount);
      });
    });

    it('Pipelines Table shows correct rows after sorting by Events Emitted Rate Asc', async () => {
      await pipelinesList.clickEventsEmittedRateCol();

      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(4);

      const pipelinesAll = await pipelinesList.getPipelinesAll();

      const tableData = [
        { id: 'test_interpolation', eventsEmittedRate: '0 e/s', nodeCount: '1' },
        { id: 'tweets_about_labradoodles', eventsEmittedRate: '0.6 e/s', nodeCount: '1' },
        { id: 'nginx_logs', eventsEmittedRate: '29.2 e/s', nodeCount: '1' },
        { id: 'main', eventsEmittedRate: '108.3 e/s', nodeCount: '1' },
      ];

      // check the all data in the table
      pipelinesAll.forEach((obj, index) => {
        expect(pipelinesAll[index].id).to.be(tableData[index].id);
        expect(pipelinesAll[index].eventsEmittedRate).to.be(tableData[index].eventsEmittedRate);
        expect(pipelinesAll[index].nodeCount).to.be(tableData[index].nodeCount);
      });
    });

    it('filters for specific pipelines', async () => {
      await pipelinesList.setFilter('la');
      const rows = await pipelinesList.getRows();
      expect(rows.length).to.be(2);
      await pipelinesList.clearFilter();
    });

    it('filters for non-existent pipeline', async () => {
      await pipelinesList.setFilter('foobar');
      await pipelinesList.assertNoData();
      await pipelinesList.clearFilter();
    });
  });
}
