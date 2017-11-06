import { XPACK_DEFAULT_ADMIN_EMAIL_UI_SETTING } from '../../../../../server/lib/constants';
import { KIBANA_SETTINGS_TYPE } from '../../../common/constants';

/*
 * Check if Cluster Alert email notifications is enabled in config
 * If so, use uiSettings API to fetch the X-Pack default admin email
 */
function getDefaultAdminEmail(config, uiSettings) {
  const clusterAlertsEmailEnabled = config.get('xpack.monitoring.cluster_alerts.email_notifications.enabled');
  if (clusterAlertsEmailEnabled) {
    return uiSettings.get(XPACK_DEFAULT_ADMIN_EMAIL_UI_SETTING);
  }
  return null;
}

// we use shouldUseNull to determine if we need to send nulls; we only send nulls if the last email wasn't null
let shouldUseNull = true;

export const checkForEmailValue = async (
  config, uiSettings, _shouldUseNull = shouldUseNull, _getDefaultAdminEmail = getDefaultAdminEmail
) => {
  const defaultAdminEmail = await _getDefaultAdminEmail(config, uiSettings);

  // Allow null so clearing the advanced setting will be reflected in the data
  const isAcceptableNull = defaultAdminEmail === null && _shouldUseNull;

  /* NOTE we have no real validation checking here. If the user enters a bad
   * string for email, their email server will alert the admin the fact what
   * went wrong and they'll have to track it back to cluster alerts email
   * notifications on their own. */

  if (isAcceptableNull || defaultAdminEmail !== null) {
    return defaultAdminEmail;
  }
};

export function getSettingsCollector(server, config) {
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  const savedObjectsClient = server.savedObjectsClientFactory({
    callCluster: callWithInternalUser
  });
  const uiSettings = server.uiSettingsServiceFactory({ savedObjectsClient });

  let _log;
  const setLogger = logger => {
    _log = logger;
  };

  const fetch = async () => {
    let kibanaSettingsData;
    const defaultAdminEmail = await checkForEmailValue(config, uiSettings);

    // skip everything if defaultAdminEmail === undefined
    if (defaultAdminEmail || (defaultAdminEmail === null && shouldUseNull)) {
      kibanaSettingsData = {
        xpack: {
          default_admin_email: defaultAdminEmail
        }
      };
      _log.debug(`[${defaultAdminEmail}] default admin email setting found, sending [${KIBANA_SETTINGS_TYPE}] monitoring document.`);
    } else {
      _log.debug(`not sending [${KIBANA_SETTINGS_TYPE}] monitoring document because [${defaultAdminEmail}] is null or invalid.`);
    }

    // remember the current email so that we can mark it as successful if the bulk does not error out
    shouldUseNull = !!defaultAdminEmail;

    return kibanaSettingsData;
  };

  return {
    type: KIBANA_SETTINGS_TYPE,
    setLogger,
    fetch
  };
}
