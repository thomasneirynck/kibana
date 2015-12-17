var sinon = require('sinon');
var _ = require('lodash');

exports.create = function (params) {
  return _.assign({
    get: sinon.spy()
  }, params);
};