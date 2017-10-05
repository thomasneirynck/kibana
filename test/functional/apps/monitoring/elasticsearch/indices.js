import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const kibanaServer = getService('kibanaServer');
  const remote = getService('remote');
  const PageObjects = getPageObjects(['monitoring', 'header']);
  const overview = getService('monitoringClusterOverview');
  const indicesList = getService('monitoringElasticsearchIndices');
  const esClusterSummaryStatus = getService('monitoringElasticsearchSummaryStatus');

  describe('monitoring/elasticsearch-indices', () => {
    before(async () => {
      await remote.setWindowSize(1600, 1000);

      await esArchiver.load('monitoring/single-red');
      await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

      await PageObjects.monitoring.navigateTo();
      await PageObjects.monitoring.getNoDataMessage();

      const fromTime = '2017-09-28 23:05:39.723';
      const toTime = '2017-09-28 23:28:44.372';
      await PageObjects.header.setAbsoluteRange(fromTime, toTime);

      // go to indices listing
      await overview.clickEsIndices();
      expect(await indicesList.isOnListing()).to.be(true);
    });

    after(async () => {
      await esArchiver.unload('monitoring/single-red');
    });

    it('Elasticsearch Cluster Summary Status shows correct info', async () => {
      const {
        nodesCount,
        indicesCount,
        memory,
        totalShards,
        unassignedShards,
        documentCount,
        dataSize
      } = await esClusterSummaryStatus.getContent();

      expect(nodesCount).to.be('Nodes: 1');
      expect(indicesCount).to.be('Indices: 26');
      expect(memory).to.be('Memory: 257MB / 677MB');
      expect(totalShards).to.be('Total Shards: 75');
      expect(unassignedShards).to.be('Unassigned Shards: 37');
      expect(documentCount).to.be('Documents: 4,507');
      expect(dataSize).to.be('Data: 7MB');
    });

    it('Indices Table shows correct rows with default sorting', async () => {
      const rows = await indicesList.getRows();
      expect(rows.length).to.be(20);

      const indicesAll = await indicesList.getIndicesAll();

      const tableData = [ /*eslint-disable max-len*/
        { name: 'many-0001_zbomuprllaog', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0003_qibsmlohonfe', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0005_gjxpdgzuqrzv', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0007_ckbaifhczwnh', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0009_thsffkbhwjcs', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0011_gfwyjurigbbb', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0013_dhbejailzaoh', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0015_wufrcdeulpvt', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0017_xsicukpktrqo', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0019_pyuafezgpnzc', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0021_qksndiatxmpr', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0023_ziderxaeaojk', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0025_vrvmsuuwvxhe', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0027_jqhchstqylqc', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0029_repulaaqwymg', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'avocado-tweets-2017.09.28', status: 'Health: yellow', documentCount: '117', dataSize: '2.5 MB', indexRate: '0 /s', searchRate: '0.28 /s', unassignedShards: '5' },
        { name: 'phone-home', status: 'Health: yellow', documentCount: '1', dataSize: '67.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '5' },
        { name: 'watermelon-tweets-2017.09.28', status: 'Health: yellow', documentCount: '22', dataSize: '948.9 KB', indexRate: '0.01 /s', searchRate: '0.31 /s', unassignedShards: '5' },
        { name: 'many-0002_zhnlgmalgnoi', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0004_djjlrznejfth', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
      ]; /*eslint-enable*/

      // check the all data in the table
      indicesAll.forEach((obj, index) => {
        expect(indicesAll[index].name).to.be(tableData[index].name);
        expect(indicesAll[index].status).to.be(tableData[index].status);
        expect(indicesAll[index].documentCount).to.be(tableData[index].documentCount);
        expect(indicesAll[index].dataSize).to.be(tableData[index].dataSize);
        expect(indicesAll[index].indexRate).to.be(tableData[index].indexRate);
        expect(indicesAll[index].searchRate).to.be(tableData[index].searchRate);
        expect(indicesAll[index].unassignedShards).to.be(tableData[index].unassignedShards);
      });
    });

    it('Indices Table shows correct rows after sorting by Search Rate Desc', async () => {
      await indicesList.clickSearchCol();
      await indicesList.clickSearchCol();

      const rows = await indicesList.getRows();
      expect(rows.length).to.be(20);

      const indicesAll = await indicesList.getIndicesAll();

      const tableData = [ /*eslint-disable max-len*/
        { name: 'many-0002_ievuwcmocfgo', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0003_mvngtmogbtvy', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0009_ctetnpezpvws', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0010_wfvudgygfugj', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0011_yrxnkwzctzxb', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0013_xujikwxyquxc', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0014_rnldrxeffqam', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'watermelon-tweets-2017.09.28', status: 'Health: yellow', documentCount: '22', dataSize: '948.9 KB', indexRate: '0.01 /s', searchRate: '0.31 /s', unassignedShards: '5' },
        { name: 'avocado-tweets-2017.09.28', status: 'Health: yellow', documentCount: '117', dataSize: '2.5 MB', indexRate: '0 /s', searchRate: '0.28 /s', unassignedShards: '5' },
        { name: 'many-0001_zbomuprllaog', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0002_zhnlgmalgnoi', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0003_qibsmlohonfe', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0004_djjlrznejfth', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0005_gjxpdgzuqrzv', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0006_udqyuppzqzsn', status: 'Health: green', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0007_ckbaifhczwnh', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0008_upxcelwxprys', status: 'Health: green', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0009_thsffkbhwjcs', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0010_bmjblieddsgm', status: 'Health: green', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '0' },
        { name: 'many-0011_gfwyjurigbbb', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
      ]; /*eslint-enable*/

      // check the all data in the table
      indicesAll.forEach((obj, index) => {
        expect(indicesAll[index].name).to.be(tableData[index].name);
        expect(indicesAll[index].status).to.be(tableData[index].status);
        expect(indicesAll[index].documentCount).to.be(tableData[index].documentCount);
        expect(indicesAll[index].dataSize).to.be(tableData[index].dataSize);
        expect(indicesAll[index].indexRate).to.be(tableData[index].indexRate);
        expect(indicesAll[index].searchRate).to.be(tableData[index].searchRate);
        expect(indicesAll[index].unassignedShards).to.be(tableData[index].unassignedShards);
      });
    });

    it('filters for specific indices', async () => {
      await indicesList.setFilter('tweet');
      const rows = await indicesList.getRows();
      expect(rows.length).to.be(2);
      await indicesList.clearFilter();
    });

    it('filters for non-existent index', async () => {
      await indicesList.setFilter('foobar');
      await indicesList.assertNoData();
      await indicesList.clearFilter();
    });
  });
}
