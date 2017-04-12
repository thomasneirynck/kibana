import { find } from 'lodash';
import { createWatchesForCluster, watchIdsForCluster } from './create_watches_for_cluster';

/**
 * {@code WatchManager} encapsulates the functionality required to work with an Elasticsearch cluster
 * to add or remove watches.
 *
 * In the future, this will also support updating watches, but this is currently out of scope.
 */
export class WatchManager {
  /**
   * Create a new {@code WatchManager} to create or delete watches.
   *
   * @param serverInfo The server information for Kibana.
   * @param server Used for logging to the server.
   * @param client Client connection configured to talk to the Monitoring cluster.
   */
  constructor(serverInfo, server, client) {
    const config = server.config();

    this._alertIndex = config.get('xpack.monitoring.cluster_alerts.index');
    this._monitoringTag = config.get('xpack.monitoring.loggingTag');
    this._version = serverInfo.version;
    this._server = server;
    this._client = client;
  }

  /**
   * Add Watches using the managed {@code client} for the given clusters.
   *
   * @param {Array} clusterUuids The Cluster UUIDs of the current clusters to support.
   * @param {Function} createWatches Injectable function to create watches for the cluster.
   *                                 Parameters: {@code alertIndex}, {@code clusterUuid}, {@code version}
   * @return {Promise} Array of Boolean success responses; one for each cluster.
   */
  setupWatchesForClusters(clusterUuids, createWatches = createWatchesForCluster) {
    this._server.log(['debug', this._monitoringTag], `Setting up watches for clusters [${clusterUuids.join(', ')}].`);

    return Promise.all(clusterUuids.map(clusterUuid => this.setupWatchesForCluster(clusterUuid, createWatches)));
  }

  /**
   * Add Watches using the managed {@code client} for the given cluster.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {Function} createWatches Injectable function to create watches for the cluster.
   *                                 Parameters: {@code alertIndex}, {@code clusterUuid}, {@code version}
   * @return {Promise} Boolean representing success ({@code true}) or failure.
   */
  setupWatchesForCluster(clusterUuid, createWatches = createWatchesForCluster) {
    this._server.log(['debug', this._monitoringTag], `Setting up watches for cluster [${clusterUuid}].`);

    return this._addWatchesToCluster(clusterUuid, createWatches(this._alertIndex, clusterUuid, this._version));
  }

  /**
   * Remove any existing Watches using the managed {@code client} for the given clusters.
   *
   * @param {Array} clusterUuids The Cluster UUIDs of the current clusters to support.
   * @return {Promise} Array of Boolean success responses; one for each cluster.
   */
  removeWatchesForClusters(clusterUuids) {
    this._server.log(['debug', this._monitoringTag], `Pruning watches for clusters [${clusterUuids.join(', ')}].`);

    return Promise.all(clusterUuids.map(clusterUuid => this.removeWatchesForCluster(clusterUuid)));
  }

  /**
   * Remove any existing Watches using the managed {@code client} for the given cluster.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @return {Promise} Boolean representing success ({@code true}) or failure.
   */
  removeWatchesForCluster(clusterUuid) {
    this._server.log(['debug', this._monitoringTag], `Pruning watches for cluster [${clusterUuid}].`);

    return this._deleteWatchesForCluster(clusterUuid, watchIdsForCluster(clusterUuid));
  }

  /**
   * Submit the watches to the cluster.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {Array} watches Watch objects to submit.
   * @return {Promise} Boolean representing success ({@code true}) or failure.
   */
  _addWatchesToCluster(clusterUuid, watches) {
    // get, then set (if necessary) all watches
    return Promise
    .all(watches.map(watch => this._createWatchIfNeeded(clusterUuid, watch.id, watch.watch)))
    .then(checkedWatches => {
      // if we can't find a response that wasn't "found", then they all exist now
      const success = find(checkedWatches, watch => !watch.found) === undefined;

      if (success) {
        this._server.log(['debug', this._monitoringTag], `Set up [${checkedWatches.length}] watches for [${clusterUuid}].`);
      }

      return success;
    });
  }

  /**
   * Add the {@code watch} using the managed {@code client} if it does not already exist.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {String} id The ID of the watch.
   * @param {Object} watch The watch to add.
   * @returns {Promise} Object containing a string {@code _id} and boolean {@code found} field.
   */
  _createWatchIfNeeded(clusterUuid, id, watch) {
    this._server.log(['debug', this._monitoringTag], `Checking for watch [${id}] for cluster [${clusterUuid}].`);

    return this._client.watcher.get_watch({
      watch_id: id,
      filterPath: 'found',
      ignore: 404
    })
    .then(res => {
      // currently we only care if it exists or not; in the future we will have to check the version
      if (!res.found) {
        return this._createWatch(clusterUuid, id, watch);
      }

      this._server.log(['debug', this._monitoringTag], `Found watch [${id}] for cluster [${clusterUuid}].`);
      return { _id: id, found: true };
    })
    .catch(err => {
      this._server.log(['error', this._monitoringTag], `Failed to check watch [${id}] for cluster [${clusterUuid}].`);
      this._server.log(['error', this._monitoringTag], err);
      return { _id: id, found: false };
    });
  }

  /**
   * Add the {@code watch} using the {@code client}.
   *
   * @param server Used for logging to the server.
   * @param client Client connection configured to talk to the Monitoring cluster.
   * @param {String} monitoringTag The monitoring tag used for logging.
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {String} id The ID of the watch.
   * @param {Object} watch The watch to add.
   * @returns {Promise} Object containing a string {@code _id} and boolean {@code found} field.
   */
  _createWatch(clusterUuid, id, watch) {
    this._server.log(['debug', this._monitoringTag], `Creating watch [${id}] for cluster [${clusterUuid}].`);

    return this._client.watcher.put_watch({
      watch_id: id,
      body: watch,
      filterPath: '_id'
    })
    .then(() => {
      this._server.log(['debug', this._monitoringTag], `Created watch [${id}] for cluster [${clusterUuid}].`);
      return { _id: id, found: true };
    })
    .catch(err => {
      this._server.log(['error', this._monitoringTag], `Unable to create watch [${id}] for cluster [${clusterUuid}].`);
      this._server.log(['error', this._monitoringTag], err);
      return { _id: id, found: false };
    });
  }

  /**
   * Remove the watches for the cluster.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {Array} watchIds Watch IDs to remove.
   * @return {Promise} Boolean representing success ({@code true}) or failure.
   */
  _deleteWatchesForCluster(clusterUuid, watchIds) {
    // get, then set (if necessary) all watches
    return Promise
    .all(watchIds.map(id => this._deleteWatch(clusterUuid, id)))
    .then(checkedWatches => {
      // if we can't find a response that wasn't "found", then they all exist now
      const success = find(checkedWatches, watch => !watch.found) === undefined;

      if (success) {
        this._server.log(['debug', this._monitoringTag], `Pruned [${checkedWatches.length}] watches for [${clusterUuid}].`);
      }

      return success;
    });
  }

  /**
   * Remove the Watch with the given {@code id} using the managed {@code client}.
   *
   * @param {String} clusterUuid The Cluster UUID of the current cluster.
   * @param {String} id The ID of the Watch.
   * @returns {Promise} Object containing a string {@code _id} and boolean {@code found} field.
   */
  _deleteWatch(clusterUuid, id) {
    this._server.log(['debug', this._monitoringTag], `Pruning watch [${id}] for cluster [${clusterUuid}].`);

    return this._client.watcher.delete_watch({
      watch_id: id,
      filterPath: '_id'
    })
    .then(() => {
      this._server.log(['debug', this._monitoringTag], `Pruned watch [${id}] for cluster [${clusterUuid}].`);
      return { _id: id, found: true };
    })
    .catch(err => {
      // Intentionally debug because this is not critical for Monitoring to properly run
      this._server.log(['debug', this._monitoringTag], `Unable to prune watch [${id}] for cluster [${clusterUuid}].`);
      this._server.log(['debug', this._monitoringTag], err);
      return { _id: id, found: false };
    });
  }
};
