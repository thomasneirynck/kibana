import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import { partial } from 'lodash';
import checkEsVersion from './check_es_version';

const NoConnections = elasticsearch.errors.NoConnections;
const REQUEST_DELAY = 2500;
const NO_INDEX = 'no_index';
const INITIALIZING = 'initializing';
const READY = 'ready';

export default function healthCheck(plugin, server) {
  const client = server.plugins.monitoring.client;
  const config = server.config();
  function getHealth() {
    return client.cluster.health({
      timeout: '5s',
      index: config.get('monitoring.index'),
      ignore: [408]
    })
    .then(resp => {
      // if "timed_out" === true then elasticsearch could not
      // find any idices matching our filter within 5 seconds
      if (!resp || resp.timed_out) {
        return NO_INDEX;
      }

      // "red" status means shards are not ready for queries
      if (resp.status === 'red') {
        return INITIALIZING;
      }

      return READY;
    });
  }

  function waitForPong() {
    return client.ping()
    .catch(err => {
      if (!(err instanceof NoConnections)) throw err;
      plugin.status.red(`Unable to connect to Elasticsearch at ${config.get('monitoring.elasticsearch.url')}.`);
      return Promise.delay(REQUEST_DELAY).then(waitForPong);
    });
  }

  function waitForShards() {
    return getHealth()
    .then(health => {
      if (health === NO_INDEX) {
        // UI will show a "waiting for data" screen
      }
      if (health === INITIALIZING) {
        plugin.status.red('Elasticsearch is still initializing the Monitoring indices');
        return Promise.delay(REQUEST_DELAY)
        .then(waitForShards);
      }
      // otherwise we are g2g
      plugin.status.green('Ready');
    });
  }

  let timeoutId = null;

  function check() {
    return waitForPong()
    .then(partial(checkEsVersion, server))
    .then(waitForShards)
    .catch(err => plugin.status.red(err));
  }

  function scheduleCheck(ms) {
    if (timeoutId) return;
    const myId = setTimeout(() => {
      check().finally(() => {
        if (timeoutId === myId) startOrRestartChecking();
      });
    }, ms);
    timeoutId = myId;
  }

  function stopChecking() {
    if (!timeoutId) return false;
    clearTimeout(timeoutId);
    timeoutId = null;
    return true;
  }

  function startOrRestartChecking() {
    scheduleCheck(stopChecking() ? REQUEST_DELAY : 1);
  }

  return {
    start: startOrRestartChecking
  };
};
