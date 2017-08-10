/**
 * Receive Phone Home is a handler for receiving phone home stats in dev mode.
 *
 * @param {function} callCluster The callWithRequest or callWithInternalUser handler
 * @param {Object} cluster The cluster being reported.
 * @param {Boolean} reportStatsTestEnabled If true, will index the stats
 * locally in the "phone-home" index in the monitoring cluster
 * @return {Promise} An object containing the response, if any.
 */
export function receivePhoneHome(callCluster, cluster, reportStatsTestEnabled) {
  if (reportStatsTestEnabled) {
    const options = {
      index: 'phone-home',
      type: 'doc',
      body: cluster
    };

    return callCluster('index', options);
  }

  return Promise.resolve({});
}
