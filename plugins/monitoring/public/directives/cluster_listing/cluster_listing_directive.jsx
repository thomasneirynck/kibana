var React = require('react');
var module = require('ui/modules').get('monitoring/directives', []);
var Table = require('plugins/monitoring/directives/paginated_table/components/table');
var ClusterRow = require('./components/cluster_row.jsx');

module.directive('monitoringClusterListing', function (globalState, kbnUrl) {
  return {
    restrict: 'E',
    scope: { clusters: '=' },
    link: function ($scope, $el) {

      var options = {
        title: null,
        searchPlaceholder: 'Filter Clusters',
        // "key" properties are scalars used for sorting
        columns: [
          {
            key: 'cluster_name',
            sort: 1,
            title: 'Name'
          },
          {
            key: 'status',
            sort: 0,
            title: 'Status'
          },
          {
            key: 'elasticsearch.stats.nodes.count.total',
            sort: 0,
            title: 'Nodes'
          },
          {
            key: 'elasticsearch.stats.indices.count',
            sort: 0,
            title: 'Indices'
          },
          {
            key: 'elasticsearch.stats.indices.store.size_in_bytes',
            sort: 0,
            title: 'Data'
          },
          {
            key: 'kibana.count',
            sort: 0,
            title: 'Kibana'
          },
          {
            key: 'license.type',
            sort: 0,
            title: 'License'
          }
        ]
      };

      var table = React.render(<Table
        scope={ $scope }
        template={ ClusterRow }
        options={ options }/>, $el[0]);

      function changeCluster(uuid) {
        $scope.$evalAsync(function () {
          globalState.cluster_uuid = uuid;
          globalState.save();
          kbnUrl.changePath('/overview');
        });
      }

      $scope.$watch('clusters', (data) => {
        if (data) {
          data.forEach((cluster) => {
            cluster.changeCluster = changeCluster;
          });
          table.setData(data);
        }
      });
    }
  };
});
