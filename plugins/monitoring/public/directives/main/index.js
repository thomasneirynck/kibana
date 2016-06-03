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
      scope.instance = attrs.instance; // undefined or name of index, node, or kibana
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
          breadcrumbs.push(createCrumb('#/elasticsearch', 'Elasticsearch'));
          if (scope.instance) {
            if (scope.name === 'indices') {
              breadcrumbs.push(createCrumb('#/indices', 'Indices'));
            } else if (scope.name === 'nodes') {
              breadcrumbs.push(createCrumb('#/nodes', 'Nodes'));
            }
          }
        }

        // Kibana crumbs
        if (scope.inKibana && scope.instance) {
          breadcrumbs.push(createCrumb('#/kibana', 'Kibana'));
        }
      }
      scope.breadcrumbs = breadcrumbs.filter(Boolean);
    }
  };
});
