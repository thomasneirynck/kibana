import { XPACK_DEFAULT_ADMIN_EMAIL_UI_SETTING } from '../../../../../server/lib/constants';
import {
  MONITORING_SYSTEM_API_VERSION, KIBANA_SYSTEM_ID, KIBANA_STATS_TYPE, KIBANA_SETTINGS_TYPE
} from '../../../common/constants';
import { mapEvent, rollupEvent } from './map_event';
import { monitoringBulk } from './monitoring_bulk';

/*
 * Check if Cluster Alert email notifications is enabled in config
 * If so, use uiSettings API to fetch the X-Pack default admin email
 */
async function getDefaultAdminEmail(config, uiSettings) {
  const clusterAlertsEmailEnabled = config.get('xpack.monitoring.cluster_alerts.email_notifications.enabled');
  if (clusterAlertsEmailEnabled) {
    return await uiSettings.get(XPACK_DEFAULT_ADMIN_EMAIL_UI_SETTING);
  }
  return null;
}

/**
 * Manage the buffer of Kibana Ops events
 * Does the bulk upload to the `admin` cluster, which tags it and forwards it
 * to the monitoring cluster
 * @param kbnServer {Object} manager of Kibana services - see `src/server/kbn_server` in Kibana core
 * @param server {Object} HapiJS server instance
 * @return {Object} the revealed `push` and `flush` modules
 */
export function opsBuffer(kbnServer, server) {
  const config = server.config();
  const interval = config.get('xpack.monitoring.kibana.collection.interval') + 'ms';
  const monitoringTag = config.get('xpack.monitoring.loggingTag');
  const logDebug = message => server.log(['debug', monitoringTag], message);
  const client = server.plugins.elasticsearch.getCluster('admin').createClient({ plugins: [monitoringBulk] });
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  const uiSettings = server.uiSettingsServiceFactory({ callCluster: callWithInternalUser });

  /*
   * Helpers for fetching the different types of data
   */
  const getKibanaSettingsData = async () => {
    const defaultAdminEmail = await getDefaultAdminEmail(config, uiSettings);
    const isNull = defaultAdminEmail === null; // allow null so clearing the advanced setting will reflect in the data
    const isValid = defaultAdminEmail && defaultAdminEmail.indexOf('@') > 0;
    if (isNull || isValid) {
      logDebug(`Null or valid default admin email setting found, sending ${KIBANA_SETTINGS_TYPE} bulk request.`);
      return [
        { index: { _type: KIBANA_SETTINGS_TYPE } },
        { xpack: { defaultAdminEmail } }
      ];
    }
    logDebug(`Invalid default admin email setting found, skipping ${KIBANA_SETTINGS_TYPE} bulk request.`);
    return [];
  };
  let lastOp = null;
  const getKibanaStatsData = () => {
    if (!lastOp) { return []; }

    // grab the last operation
    const payload = mapEvent(lastOp, config, kbnServer);

    // reset lastOp
    lastOp = null;

    return [
      // Push the time-based information to .monitoring-kibana-*
      { index: { _type: KIBANA_STATS_TYPE } },
      payload
    ];
  };

  return {
    push(event) {
      lastOp = {
        host: event.host,
        rollup: rollupEvent(event, lastOp)
      };
      logDebug('Received Kibana Ops event data');
    },
    flush() {
      // Have production cluster forward stats to monitoring cluster
      // to push the time-based information to .monitoring-kibana-*
      return Promise.resolve()
      /* Get the Kibana Settings data and pass it along
       * TODO: move this to a separate module. Depends on refactoring from
       * https://github.com/elastic/x-pack-kibana/pull/1592
       * Should also use a single bulk request for multiple types / multiple intervals
       */
      .then(getKibanaSettingsData)
      // combine the settings data with ops data
      .then(body => body.concat(getKibanaStatsData()))
      .then(body => {
        if (body.length > 0) {
          // make a single bulk request with kibana_settings and kibana_stats payloads
          logDebug('Sending Kibana Settings and Ops payload to Monitoring Elasticsearch');
          return client.monitoring.bulk({
            system_id: KIBANA_SYSTEM_ID,
            system_api_version: MONITORING_SYSTEM_API_VERSION,
            interval,
            body
          });
        }
      })
      .catch((err) => {
        server.log(['error', monitoringTag], err);
      });
    }
  };
}
