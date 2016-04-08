module.exports = function (client, clusterState) {
  if (clusterState) return Promise.resolve(clusterState);
  return client.cluster.state();
};
