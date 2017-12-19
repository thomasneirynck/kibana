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
        expect(await overview.getEsStatus()).to.be('Health is green');
        expect(await overview.getEsVersion()).to.be('7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('20 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 2');
        expect(await overview.getEsDiskAvailable()).to.be('40.35%\n188GB / 465GB');
        expect(await overview.getEsJvmHeap()).to.be('43.90%\n526MB / 1GB');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 17');
        expect(await overview.getEsDocumentsCount()).to.be('4,001');
        expect(await overview.getEsDiskUsage()).to.be('11MB');
        expect(await overview.getEsPrimaryShards()).to.be('49');
        expect(await overview.getEsReplicaShards()).to.be('49');
      });

      it('shows kibana panel', async () => {
        expect(await overview.getEsStatus()).to.be('Health is green');
        expect(await overview.getKbnRequests()).to.be('914');
        expect(await overview.getKbnMaxResponseTime()).to.be('2873 ms');
        expect(await overview.getKbnInstances()).to.be('Instances: 1');
        expect(await overview.getKbnConnections()).to.be('646');
        expect(await overview.getKbnMemoryUsage()).to.be('13.05%\n187MB / 1GB');
      });

      it('shows logstash panel', async () => {
        expect(await overview.getLsEventsReceived()).to.be('31');
        expect(await overview.getLsEventsEmitted()).to.be('31');
        expect(await overview.getLsNodes()).to.be('Nodes: 1');
        expect(await overview.getLsUptime()).to.be('10 minutes');
        expect(await overview.getLsJvmHeap()).to.be('46.16%\n457MB / 991MB');
        expect(await overview.getLsPipelines()).to.be('Pipelines: 1');
      });
    });

    describe('for Yellow cluster with Platinum license', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-platinum');
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
        expect(await overview.getEsMlJobs()).to.be('0');
      });

      it('shows elasticsearch panel with data', async () => {
        expect(await overview.getEsStatus()).to.be('Health is yellow');
        expect(await overview.getEsVersion()).to.be('7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('5 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 1');
        expect(await overview.getEsDiskAvailable()).to.be('40.05%\n186GB / 465GB');
        expect(await overview.getEsJvmHeap()).to.be('25.06%\n150MB / 599MB');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 8');
        expect(await overview.getEsDocumentsCount()).to.be('160');
        expect(await overview.getEsDiskUsage()).to.be('806KB');
        expect(await overview.getEsPrimaryShards()).to.be('8');
        expect(await overview.getEsReplicaShards()).to.be('0');
      });

      it('shows kibana panel', async () => {
        expect(await overview.getKbnStatus()).to.be('Health is green');
        expect(await overview.getKbnRequests()).to.be('174');
        expect(await overview.getKbnMaxResponseTime()).to.be('2203 ms');
        expect(await overview.getKbnInstances()).to.be('Instances: 1');
        expect(await overview.getKbnConnections()).to.be('174');
        expect(await overview.getKbnMemoryUsage()).to.be('15.33%\n220MB / 1GB');
      });

      it('does not show logstash panel', async () => {
        expect(await overview.doesLsPanelExist()).to.be(false);
      });
    });

    describe('for Yellow cluster with Basic license and no Kibana / Logstash', () => {
      before(async () => {
        await esArchiver.load('monitoring/singlecluster-yellow-basic');
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
        expect(await overview.getEsStatus()).to.be('Health is yellow');
        expect(await overview.getEsVersion()).to.be('7.0.0-alpha1');
        expect(await overview.getEsUptime()).to.be('8 minutes');
        expect(await overview.getEsNumberOfNodes()).to.be('Nodes: 1');
        expect(await overview.getEsDiskAvailable()).to.be('40.02%\n186GB / 465GB');
        expect(await overview.getEsJvmHeap()).to.be('20.06%\n120MB / 599MB');
        expect(await overview.getEsNumberOfIndices()).to.be('Indices: 7');
        expect(await overview.getEsDocumentsCount()).to.be('410');
        expect(await overview.getEsDiskUsage()).to.be('724KB');
        expect(await overview.getEsPrimaryShards()).to.be('7');
        expect(await overview.getEsReplicaShards()).to.be('0');
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
