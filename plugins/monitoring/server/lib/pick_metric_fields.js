const _ = require('lodash');
module.exports = (metric) => {
  const fields = [
    'app',
    'field',
    'label',
    'title',
    'description',
    'units',
    'format'
  ];
  return _.pick(metric, fields);
};
