import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');

  describe('monitoring/cluster-overview', () => {
    before(() => {
      remote.setWindowSize(1600, 1000);
    });

    describe('for Green cluster with Gold license', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-green-gold');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-23 21:29:35.267';
        const toTime = '2017-08-23 21:47:25.556';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);
      });

      after(async () => {
        await esArchiver.unload('monitoring/singlecluster-green-gold');
      });

      it('does not show alerts panel, because cluster status is Green', async () => {
        expect(await overview.doesClusterAlertsExist()).to.be(false);
      });

      it('elasticsearch panel has no ML line, because license is Gold', async () => {
        expect(await overview.doesEsMlJobsExist()).to.be(false);
      });

      it('shows elasticsearch panel with data', async () => {
        expect(await overview.getEsStatus()).to.be('Health: green');
        expect(await overview.getEsVersion()).to.be('Version: 7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('Uptime: 20 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 2');
        expect(await overview.getEsDiskAvailable()).to.be('Disk Available: 188GB / 465GB  (40.35%)');
        expect(await overview.getEsJvmHeap()).to.be('JVM Heap: 43.90%  (526MB / 1GB)');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 17');
        expect(await overview.getEsDocumentsCount()).to.be('Documents: 4,001');
        expect(await overview.getEsDiskUsage()).to.be('Disk Usage: 11MB');
        expect(await overview.getEsPrimaryShards()).to.be('Primary Shards: 49');
        expect(await overview.getEsReplicaShards()).to.be('Replica Shards: 49');
      });

      it('shows kibana panel', async () => {
        expect(await overview.getEsStatus()).to.be('Health: green');
        expect(await overview.getKbnRequests()).to.be('Requests: 914');
        expect(await overview.getKbnMaxResponseTime()).to.be('Max. Response Time: 2873 ms');
        expect(await overview.getKbnInstances()).to.be('Instances: 1');
        expect(await overview.getKbnConnections()).to.be('Connections: 646');
        expect(await overview.getKbnMemoryUsage()).to.be('Memory Usage: 13.05%  (187MB / 1GB)');
      });

      it('shows logstash panel', async () => {
        expect(await overview.getLsEventsReceived()).to.be('Events Received: 31');
        expect(await overview.getLsEventsEmitted()).to.be('Events Emitted: 31');
        expect(await overview.getLsNodes()).to.be('Nodes: 1');
        expect(await overview.getLsUptime()).to.be('Uptime: 10 minutes');
        expect(await overview.getLsJvmHeap()).to.be('JVM Heap: 46.16%  (457MB / 991MB)');
        expect(await overview.getLsPipelines()).to.be('Pipelines: 1');
      });
    });

    describe('for Yellow cluster with Platinum license', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-29 17:23:47.528';
        const toTime = '2017-08-29 17:25:50.701';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);
      });

      after(async () => {
        await esArchiver.unload('monitoring/singlecluster-yellow-platinum');
      });

      it('shows alerts panel, because cluster status is Yellow', async () => {
        expect(await overview.doesClusterAlertsExist()).to.be(true);
      });

      it('elasticsearch panel has ML, because license is Platinum', async () => {
        expect(await overview.getEsMlJobs()).to.be('Jobs: 0');
      });

      it('shows elasticsearch panel with data', async () => {
        expect(await overview.getEsStatus()).to.be('Health: yellow');
        expect(await overview.getEsVersion()).to.be('Version: 7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('Uptime: 5 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 1');
        expect(await overview.getEsDiskAvailable()).to.be('Disk Available: 186GB / 465GB  (40.05%)');
        expect(await overview.getEsJvmHeap()).to.be('JVM Heap: 25.06%  (150MB / 599MB)');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 8');
        expect(await overview.getEsDocumentsCount()).to.be('Documents: 160');
        expect(await overview.getEsDiskUsage()).to.be('Disk Usage: 806KB');
        expect(await overview.getEsPrimaryShards()).to.be('Primary Shards: 8');
        expect(await overview.getEsReplicaShards()).to.be('Replica Shards: 0');
      });

      it('shows kibana panel', async () => {
        expect(await overview.getKbnStatus()).to.be('Health: green');
        expect(await overview.getKbnRequests()).to.be('Requests: 174');
        expect(await overview.getKbnMaxResponseTime()).to.be('Max. Response Time: 2203 ms');
        expect(await overview.getKbnInstances()).to.be('Instances: 1');
        expect(await overview.getKbnConnections()).to.be('Connections: 174');
        expect(await overview.getKbnMemoryUsage()).to.be('Memory Usage: 15.33%  (220MB / 1GB)');
      });

      it('does not show logstash panel', async () => {
        expect(await overview.doesLsPanelExist()).to.be(false);
      });
    });

    describe('for Yellow cluster with Basic license and no Kibana / Logstash', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-basic');
        await kibanaServer.waitForStabilization();
        await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

        await PageObjects.monitoring.navigateTo();
        await PageObjects.monitoring.getNoDataMessage();

        const fromTime = '2017-08-29 17:55:43.879';
        const toTime = '2017-08-29 18:01:34.958';
        await PageObjects.header.setAbsoluteRange(fromTime, toTime);
      });

      after(async () => {
        await esArchiver.unload('monitoring/singlecluster-yellow-basic');
      });

      it('does not show alerts panel, because license is Basic', async () => {
        expect(await overview.doesClusterAlertsExist()).to.be(false);
      });

      it('elasticsearch panel does not have ML, because license is Basic', async () => {
        expect(await overview.doesEsMlJobsExist()).to.be(false);
      });

      it('shows elasticsearch panel with data', async () => {
        expect(await overview.getEsStatus()).to.be('Health: yellow');
        expect(await overview.getEsVersion()).to.be('Version: 7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('Uptime: 8 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 1');
        expect(await overview.getEsDiskAvailable()).to.be('Disk Available: 186GB / 465GB  (40.02%)');
        expect(await overview.getEsJvmHeap()).to.be('JVM Heap: 20.06%  (120MB / 599MB)');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 7');
        expect(await overview.getEsDocumentsCount()).to.be('Documents: 410');
        expect(await overview.getEsDiskUsage()).to.be('Disk Usage: 724KB');
        expect(await overview.getEsPrimaryShards()).to.be('Primary Shards: 7');
        expect(await overview.getEsReplicaShards()).to.be('Replica Shards: 0');
      });

      it('shows kibana panel', async () => {
        expect(await overview.doesKbnPanelExist()).to.be(false);
      });

      it('does not show logstash panel', async () => {
        expect(await overview.doesLsPanelExist()).to.be(false);
      });
    });
  });
}
