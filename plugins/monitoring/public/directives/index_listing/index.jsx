import numeral from 'numeral';
import React from 'react';
import Table from 'plugins/monitoring/directives/paginated_table/components/table';
import uiModules from 'ui/modules';

function showSystemIndicesComponentFactory(scope) {
  return class ShowSystemIndicesComponent extends React.Component {

    constructor(props) {
      super();
      this.state = { showSystemIndices: props.showSystemIndices };
      // method not automatically bound to the component instance because of using ES6 class syntax
      this.toggleShowSystemIndices = this.toggleShowSystemIndices.bind(this);
    }

    toggleShowSystemIndices() {
      this.setState({ showSystemIndices: !this.state.showSystemIndices });
      scope.$evalAsync(() => {
        scope.toggleShowSystemIndices();
        scope.resetPaging();
      });
    }

    render() {
      return (
        <div className='pull-left filter-member'>
          <input type='checkbox'
            onChange={this.toggleShowSystemIndices}
            checked={this.state.showSystemIndices}/>&nbsp;
          <span onClick={this.toggleShowSystemIndices}>Show system indices</span>
          &nbsp;
          <i className="fa fa-question-circle" title="System index names begin with a dot, for example `.kibana`."></i>
        </div>
      );
    }

  };
}

function indexRowFactory(scope, kbnUrl) {
  return class IndexRow extends React.Component {

    constructor() {
      super();
      this.changePath = this.changePath.bind(this);
    }

    changePath() {
      scope.$evalAsync(() => {
        kbnUrl.changePath(`/elasticsearch/indices/${this.props.name}`);
      });
    }

    render() {
      const numeralize = value => numeral(value.last).format(value.metric ? value.metric.format : null);
      const unitize = value => `${numeralize(value)} ${value.metric.units}`;
      const name = this.props.name;
      const metrics = this.props.metrics;
      const docCount = numeralize(metrics.index_document_count);
      const indexSize = numeralize(metrics.index_size);
      const requestRate = unitize(metrics.index_request_rate_primary);
      const searchRate = unitize(metrics.index_search_request_rate);
      const unassignedShards = numeralize(metrics.index_unassigned_shards);

      return (
        <tr key={name} className={this.props.status}>
          <td>
            <a onClick={this.changePath}>{name}</a>
          </td>
          <td>{docCount}</td>
          <td>{indexSize}</td>
          <td>{requestRate}</td>
          <td>{searchRate}</td>
          <td>{unassignedShards}</td>
        </tr>
      );
    }

  };
}

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringIndexListing', function (kbnUrl) {
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
      sortKey: 'metrics.index_unassigned_shards.last',
      title: 'Unassigned Shards'
    }]
  };

  return {
    restrict: 'E',
    scope: {
      data: '=',
      showSystemIndices: '=',
      toggleShowSystemIndices: '='
    },
    link(scope, $el) {

      const ShowSystemIndicesComponent = showSystemIndicesComponentFactory(scope);
      const IndexRow = indexRowFactory(scope, kbnUrl);
      const $table = React.createElement(Table, {
        scope,
        options: initialTableOptions,
        filterMembers: [<ShowSystemIndicesComponent showSystemIndices={scope.showSystemIndices}/>],
        template: IndexRow
      });
      const tableInstance = React.render($table, $el[0]);
      scope.resetPaging = () => {
        tableInstance.setCurrPage(0);
      };
      scope.$watch('data', (data) => {
        tableInstance.setData(data);
      });

    }
  };
});
