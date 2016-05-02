// Permissions check. If authentication doesn't have privilege to view
// monitoring data, then this causes the permissions error, instead of
// leaving fieldStats to cause a 404 error.
export default function checkMonitoringAuth(req) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  return callWithRequest(req, 'indices.getMapping', {
    index: config.get('xpack.monitoring.index'),
    type: 'cluster_info'
  });
};
