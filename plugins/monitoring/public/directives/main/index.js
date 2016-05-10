import _ from 'lodash';
const app = require('ui/modules').get('plugins/monitoring/directives', []);
app.directive('monitoringMain', (license, globalState) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope, _el, attrs) {
      scope.name = attrs.name; // name of current page
      scope.product = attrs.product; // undefined, elasticsearch, or kibana
      scope.clusterName = globalState.cluster_name;
      const productIsIn = (checkKey) => scope.product === checkKey;
      if (scope.product) {
        scope.inElasticsearch = productIsIn('elasticsearch');
        scope.inKibana = productIsIn('kibana');
      } else {
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
    }
  };
});
