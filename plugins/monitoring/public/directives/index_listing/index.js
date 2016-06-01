define(function (require) {
  var _ = require('lodash');
  var numeral = require('numeral');
  var module = require('ui/modules').get('monitoring/directives', []);
  var React = require('react');
  var Table = require('plugins/monitoring/directives/paginated_table/components/table');

  module.directive('monitoringIndexListing', function (kbnUrl) {
    var initialTableOptions = {
      title: 'Indices',
      searchPlaceholder: 'Filter Indices',
      /* "key" should be an object
       *   - unless it's the "name" key
       *   - the key object should have:
       *      - "metric" object
       *      - "last" scalar
       * "sortKey" should be a scalar */
      columns: [{
        key: 'name',
        sort: 1,
        title: 'Name'
      }, {
        key: 'metrics.index_document_count',
        sortKey: 'metrics.index_document_count.last',
        title: 'Document Count'
      }, {
        key: 'metrics.index_size',
        sortKey: 'metrics.index_size.last',
        title: 'Data'
      }, {
        key: 'metrics.index_request_rate_primary',
        sortKey: 'metrics.index_request_rate_primary.last',
        title: 'Index Rate'
      }, {
        key: 'metrics.index_search_request_rate',
        sortKey: 'metrics.index_search_request_rate.last',
        title: 'Search Rate'
      }, {
        key: 'metrics.index_unassigned_shards',
        sortKey: 'metrics.index_unassigned_shards',
        title: 'Unassigned Shards'
      }]
    };

    return {
      restrict: 'E',
      scope: {
        data: '='
      },
      link: function (scope, $el) {
        var tableRowTemplate = React.createClass({
          getInitialState: function () {
            var index = _.findWhere(scope.data, {name: this.props.name});
            return {
              exists: !!index,
              status: !!index ? index.status : 'disabled'
            };
          },
          componentWillReceiveProps: function () {
            if (scope.data) {
              var index = _.findWhere(scope.data, {name: this.props.name});
              this.setState({
                exists: !!index,
                status: !!index ? index.status : 'disabled'
              });
            }
          },
          render: function () {
            const numeralize = value => numeral(value.last).format(value.metric.format);
            const unitize = value => `${numeralize(value)} ${value.metric.units}`;
            const name = this.props.name;
            const clickFn = () => {
              scope.$evalAsync(function () {
                kbnUrl.changePath(`/indices/${name}`);
              });
            };
            const metrics = this.props.metrics;
            const docCount = numeralize(metrics.index_document_count);
            const indexSize = numeralize(metrics.index_size);
            const requestRate = unitize(metrics.index_request_rate_primary);
            const searchRate = unitize(metrics.index_search_request_rate);
            const unassignedShards = numeralize(metrics.index_unassigned_shards);

            return (
              <tr key={name} className={[this.state.status]}>
                <td>
                  <a onClick={clickFn}>
                    {name}
                  </a>
                </td>
                <td>{docCount}</td>
                <td>{indexSize}</td>
                <td>{requestRate}</td>
                <td>{searchRate}</td>
                <td>{unassignedShards}</td>
              </tr>
            );
          }
        });

        var tableFactory = React.createFactory(Table);
        var table = React.render(tableFactory({
          scope: scope,
          options: initialTableOptions,
          template: tableRowTemplate
        }), $el[0]);

        scope.$watch('data', (data) => {
          table.setData(data);
          table.render();
        });
      }
    };
  });
});

