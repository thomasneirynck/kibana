const Promise = require('bluebird');
const getSeries = require('./get_series');
module.exports = function getMetrics(req, indices, filters = []) {
  const metrics = req.payload.metrics || [];
  return Promise.map(metrics, metric => {
    // map over the multiple metric series that are separated by `$`
    const metricNames = metric.split('$');
    return Promise.map(metricNames, metricName => {
      return getSeries(req, indices, metricName, filters);
    });
  })
  .then(rows => {
    const data = {};
    metrics.forEach((key, index) => {
      data[key] = rows[index];
    });
    return data;
  });
};
