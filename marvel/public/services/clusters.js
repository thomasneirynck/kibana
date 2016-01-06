define(function (require) {
  var _ = require('lodash');
  var angular = require('angular');
  require('angular-resource');

  var module = require('ui/modules').get('marvel/clusters', [ 'ngResource' ]);
  module.service('marvelClusters', function ($resource, Promise, Private) {

    // always use relative paths for endpoints, because absolute will break any reverse proxying
    var Clusters = $resource('../api/marvel/v1/clusters/:id', { id: '@cluster_uuid' });
    var cache;

    function fetch() {
      return Clusters.query().$promise
      .then(function (clusters) {
        return clusters;
      })
      .catch(function (err) {
        var ajaxErrorHandlers = Private(require('plugins/marvel/lib/ajax_error_handlers'));
        return ajaxErrorHandlers.fatalError(err);
      });
    }

    return { fetch: fetch };

  });
});
