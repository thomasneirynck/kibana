import _ from 'lodash';
const app = require('ui/modules').get('plugins/monitoring/directives', []);

function createCrumb(url, label, condition = true) {
  if (condition) {
    return {
      url,
      label
    };
  }
}

app.directive('monitoringMain', (license) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope, _el, attrs) {
      scope.name = attrs.name; // name of current page
      scope.product = attrs.product; // undefined, elasticsearch, or kibana
      scope.clusterName = scope.cluster.cluster_name;
      const productIsIn = (checkKey) => scope.product === checkKey;
      if (scope.product) {
        scope.inElasticsearch = productIsIn('elasticsearch');
        scope.inKibana = productIsIn('kibana');
      } else {
        scope.product = false;
        scope.inOverview = scope.name === 'overview';
        scope.inListing = scope.name === 'listing';
      }

      // hide tabs for some pages (force to select a cluster before drill-in)
      const noTabs = ['no-data'];
      scope.allowTabs = !_.contains(noTabs, scope.name);

      // hide clusters tab for basic license
      scope.allowClusterTab = !license.isBasic();

      scope.isActive = function (testPath) {
        return scope.name === testPath;
      };

      let breadcrumbs = [];
      if (scope.name !== 'listing') {
        breadcrumbs = [
          createCrumb('#/home', 'Clusters'),
          createCrumb('#/overview', scope.clusterName, scope.inOverview),
        ];

        // Elasticsearch crumbs
        if (scope.inElasticsearch) {
          breadcrumbs.push(createCrumb('#/elasticsearch', 'Elasticsearch', true));
          if (attrs.name === 'indices') {
            breadcrumbs = breadcrumbs.concat([
              createCrumb('#/indices', 'Indices', true),
              createCrumb(null, attrs.index, !_.isUndefined(attrs.index))
            ]);
          }
          if (attrs.name === 'nodes') {
            breadcrumbs = breadcrumbs.concat([
              createCrumb('#/nodes', 'Nodes', true),
              createCrumb(null, attrs.node, !_.isUndefined(attrs.node))
            ]);
          }
        }

        // Kibana crumbs
        if (scope.inKibana) {
          breadcrumbs = breadcrumbs.concat([
            createCrumb('#/kibana', 'Kibana', true),
            createCrumb(null, attrs.kibana, !_.isUndefined(attrs.kibana))
          ]);
        }
      }
      scope.breadcrumbs = breadcrumbs.filter(Boolean);
    }
  };
});
