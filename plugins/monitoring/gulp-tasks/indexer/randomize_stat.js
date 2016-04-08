var _ = require('lodash');
module.exports = function randomize(stat, path, floor) {
  var val = _.get(stat, path);
  var min = val * 0.6;
  var max = val * 1.2;
  var newVal = Math.abs(_.random(min, max));
  _.set(stat, path, floor ? Math.floor(newVal) : newVal);
};
