const yargs = require('yargs').argv;
const Promise = require('bluebird');
const moment = require('moment');
const uuid = require('node-uuid');

const elasticsearch = require('elasticsearch');
const fakeClusterState = require('./indexer/fake_cluster_state');
const indexRecovery = require('./indexer/index_recovery');
const indexClusterState = require('./indexer/index_cluster_state');
const indexClusterStats = require('./indexer/index_cluster_stats');
const indexNodeStats = require('./indexer/index_node_stats');
const indexIndexStats = require('./indexer/index_index_stats');
const indexIndicesStats = require('./indexer/index_indices_stats');
const indexShards = require('./indexer/index_shards');
const monitoringIndexTemplate = require('./indexer/monitoring_index_template.json');
const createLicenseDoc = require('./indexer/create_license_doc');

module.exports = (gulpUtil) => {
  return (done) => {
    const host = yargs.elasticsearch || 'localhost:9200';
    const monitoring = yargs.monitoring || 'localhost:9200';
    const licenseType = yargs.license || 'trial';
    const expires = yargs.expires && moment(yargs.expires) || moment().add(356, 'days');
    const interval = 5000;
    const client = new elasticsearch.Client({ requestTimeout: 120000, host });
    const monitoringClient = new elasticsearch.Client({ requestTimeout: 120000, host: monitoring });
    let clusterState;
    if (yargs.medium || yargs.gigantic) {
      if (yargs.gigantic) {
        clusterState = fakeClusterState({ indices: 800, nodes: 100 }) || false;
      }
      if (yargs.medium) {
        clusterState = fakeClusterState({ indices: 100, nodes: 20 }) || false;
      }
    }
    monitoringClient.indices.putTemplate({ name: 'monitoring', body: monitoringIndexTemplate })
    .then(() => {
      const overrides = {
        type: licenseType,
        expiry_date_in_millis: expires.valueOf(),
        issue_date_in_millis: expires.clone().subtract(356, 'days').valueOf()
      };
      return createLicenseDoc(client, monitoringClient, overrides, clusterState);
    })
    .then(() => {
      function index() {
        const start = moment.utc().valueOf();
        gulpUtil.log('Starting', gulpUtil.colors.cyan('index'));
        if (clusterState) {
          clusterState.state_uuid = uuid.v4();
          clusterState.version++;
        }
        const bulks = [];
        return Promise.each([
          indexClusterState,
          indexShards,
          indexClusterStats,
          indexIndicesStats,
          indexNodeStats,
          indexIndexStats,
          indexRecovery
        ], (fn) => {
          return fn(bulks, client, monitoringClient, clusterState);
        })
        .then(() => {
          const numberOfSets = Math.ceil(bulks.length / 200);
          const sets = [];
          for (let n = 0; n < numberOfSets; n++) {
            sets.push(bulks.splice(0,200));
          }
          return Promise.each(sets, (set) => {
            return monitoringClient.bulk({ body: set });
          });
        })
        .then(() => {
          const end = moment.utc().valueOf();
          gulpUtil.log('Finishing', gulpUtil.colors.cyan('index'), 'after', gulpUtil.colors.magenta((end - start) + ' ms'));
          setTimeout(index, interval);
        })
        .catch((err) => {
          gulpUtil.log(err.stack);
          setTimeout(index, interval);
        });
      }
      index();
    })
    .catch(done);
  };
};
