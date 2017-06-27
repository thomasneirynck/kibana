/**
 * Receive Phone Home is a handler for receiving phone home stats in dev mode.
 *
 * @param {function} callCluster The callWithRequest or callWithInternalUser handler
 * @param {Object} cluster The cluster being reported.
 * @return {Promise} An object containing the response, if any.
 */
export function receivePhoneHome(callCluster, cluster) {
  // Change to false to test indexing the data. Note, callWith user must have privileges to write
  if (true) {
    return Promise.resolve({});
  }

  const options = {
    index: '.monitoring',
    type: 'doc',
    body: cluster
  };

  return callCluster('index', options);
}
