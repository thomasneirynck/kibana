var moment = require('moment');
var _ = require('lodash');
module.exports = function mergePaths(bulks, monitoringClient, state, paths, type, prefix) {
  prefix = prefix || '';
  return function (source) {
    var timestamp = moment.utc();
    var body = {
      cluster_uuid: state.metadata.cluster_uuid,
      'timestamp': timestamp.toISOString()
    };
    paths.forEach(function (path) {
      var template = _.template(path);
      var destPath = template({ prefix: prefix });
      var srcPath = template({ prefix: '' });
      _.set(body, destPath, _.get(source, srcPath));
    });
    var head = {
      _index: timestamp.format('[.monitoring-es-1-]YYYY.MM.DD'),
      _type: type
    };
    if (source._id) head._id = source._id;
    bulks.push({ create: head });
    bulks.push(body);
    return bulks;
  };
};
