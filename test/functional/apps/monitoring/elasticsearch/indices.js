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

      await esArchiver.load('monitoring/singlecluster-red-platinum');
      const fromTime = '2017-10-06 19:53:06.748';
      const toTime = '2017-10-06 20:15:30.212';
      await kibanaServer.uiSettings.replace({ 'dateFormat:tz': 'UTC' });

      await PageObjects.monitoring.navigateTo();
      await PageObjects.monitoring.getNoDataMessage();

      await PageObjects.header.setAbsoluteRange(fromTime, toTime);

      // go to indices listing
      await overview.clickEsIndices();
      expect(await indicesList.isOnListing()).to.be(true);
    });

    after(async () => {
      await esArchiver.unload('monitoring/singlecluster-red-platinum');
    });

    it('Elasticsearch Cluster Summary Status shows correct info', async () => {
      expect(await esClusterSummaryStatus.getContent()).to.eql({
        nodesCount: 'Nodes: 1',
        indicesCount: 'Indices: 19',
        memory: 'Memory: 268MB / 677MB',
        totalShards: 'Total Shards: 46',
        unassignedShards: 'Unassigned Shards: 23',
        documentCount: 'Documents: 4,535',
        dataSize: 'Data: 9MB',
        health: 'Health: red',
      });
    });

    it('Indices Table shows correct rows with default sorting', async () => {
      const rows = await indicesList.getRows();
      expect(rows.length).to.be(20);

      const indicesAll = await indicesList.getIndicesAll();

      const tableData = [ /*eslint-disable max-len*/
        { name: 'many-0007_milycdknpycp', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0009_reolfgzjjtvh', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0011_xtkcmlwmxcov', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0013_smjuwdkhpduv', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0015_vwmrucgzvohb', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0017_zpyxggzmytun', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0019_slpgftmneikv', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0021_xjtlceanhvup', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0023_hkbvktonytxh', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'many-0025_xmvpnfeuqxtp', status: 'Health: red',    documentCount: '1', dataSize: '3.6 KB',  indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '1' },
        { name: 'phone-home',             status: 'Health: yellow', documentCount: '1', dataSize: '66.2 KB', indexRate: '0 /s', searchRate: '0 /s',    unassignedShards: '5' },
        { name: 'many-0006_gkuqbjonkjmg', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '4.08 /s', unassignedShards: '0' },
        { name: 'many-0008_amnscruqlsnu', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '4.08 /s', unassignedShards: '0' },
        { name: 'many-0010_dgnlpqtstfvi', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0012_jwomwdgfpisl', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0014_zrukbrvuluby', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0016_gyvtsyauoqqg', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0018_ipugjcmuagih', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0020_fqfovcnznbus', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0022_dqbcjopzejlk', status: 'Health: green',  documentCount: '1', dataSize: '3.7 KB',  indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
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
        { name: 'many-0001_clruksahirti', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0002_emdkmgdeflno', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0003_jbwrztjwhkjt', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0004_wzgjkelqclur', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0005_dnzzblxoumfe', status: 'Health: Deleted', documentCount: 'N/A', dataSize: 'N/A', indexRate: 'N/A', searchRate: 'N/A', unassignedShards: 'N/A' },
        { name: 'many-0006_gkuqbjonkjmg', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '4.08 /s', unassignedShards: '0' },
        { name: 'many-0008_amnscruqlsnu', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '4.08 /s', unassignedShards: '0' },
        { name: 'many-0010_dgnlpqtstfvi', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0012_jwomwdgfpisl', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0014_zrukbrvuluby', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0016_gyvtsyauoqqg', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0018_ipugjcmuagih', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0020_fqfovcnznbus', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0022_dqbcjopzejlk', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0024_rixhhwzyiczb', status: 'Health: green', documentCount: '1', dataSize: '3.7 KB', indexRate: '0 /s', searchRate: '1.95 /s', unassignedShards: '0' },
        { name: 'many-0007_milycdknpycp', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0009_reolfgzjjtvh', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0011_xtkcmlwmxcov', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0013_smjuwdkhpduv', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
        { name: 'many-0015_vwmrucgzvohb', status: 'Health: red', documentCount: '1', dataSize: '3.6 KB', indexRate: '0 /s', searchRate: '0 /s', unassignedShards: '1' },
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
      await indicesList.setFilter('000');
      const rows = await indicesList.getRows();
      expect(rows.length).to.be(9);
      await indicesList.clearFilter();
    });

    it('filters for non-existent index', async () => {
      await indicesList.setFilter('foobar');
      await indicesList.assertNoData();
      await indicesList.clearFilter();
    });
  });
}
