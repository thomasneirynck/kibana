/* Check "read" privileges on the monitoring data. If the currently logged-in
 * user doesn't have permission to read the data, this check will throw an HTTP
 * error.
 *
 * FIXME: This needs to be replaced with a better API for checking if the
 * current user has read permissions to the monitoring data.
 * The `.monitoring-data-2` index [config.get('xpack.monitoring.index')] is
 * going away. When it does, searching the monitoring data will be done with
 * index patterns - we won't definitively know any name of a specific
 * monitoring index.  Using this hack to check for read permissions only works
 * when we DON'T use an index pattern - it requires usage of a specific index.
 * Enhancement issue: https://github.com/elastic/x-pack-elasticsearch/issues/1316
 *
 * @param req {Object} the server route handler request object
 * @return Boolean
 */
export async function checkMonitoringAuth(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();

  await callWithRequest(req, 'count', {
    index: config.get('xpack.monitoring.index'),
    ignore: [404]
  });

  return true;
};
