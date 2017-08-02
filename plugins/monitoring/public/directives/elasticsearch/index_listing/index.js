import numeral from 'numeral';
import { capitalize } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { SORT_ASCENDING, SORT_DESCENDING } from 'monitoring-constants';
import { uiModules } from 'ui/modules';
import {
  KuiKeyboardAccessible,
  KuiToolBarSection,
  KuiToolBarText,
  KuiTableRowCell,
  KuiTableRow
} from 'ui_framework/components';
import { MonitoringTable } from 'plugins/monitoring/components/table';
import { ElasticsearchStatusIcon } from 'plugins/monitoring/components/elasticsearch/status_icon';

const showSystemIndicesComponentFactory = scope => {
  return class ShowSytemIndicesCheckbox extends React.Component {
    constructor(props) {
      super();
      this.state = { showSystemIndices: props.showSystemIndices };
      this.toggleShowSystemIndices = this.toggleShowSystemIndices.bind(this);
    }
    // See also directives/shard_allocation/components/tableHead
    toggleShowSystemIndices(e) {
      const isChecked = e.target.checked;
      this.setState({ showSystemIndices: !this.state.showSystemIndices });
      scope.$evalAsync(() => {
        scope.toggleShowSystemIndices(isChecked);
      });
    }
    render() {
      return (
        <KuiToolBarSection>
          <KuiToolBarText>
            <label className='kuiCheckBoxLabel'>
              <input
                className='kuiCheckBox'
                type='checkbox'
                onChange={ this.toggleShowSystemIndices }
                checked={ this.state.showSystemIndices }
              />
              <span className='kuiCheckBoxLabel__text'>Show system indices</span>
            </label>
          </KuiToolBarText>
        </KuiToolBarSection>
      );
    }
  };
};

const filterFields = ['name', 'status'];
const cols = [
  { title: 'Name', sortKey: 'name', secondarySortOrder: SORT_ASCENDING },
  { title: 'Status', sortKey: 'statusSort', sortOrder: SORT_DESCENDING }, // default sort: red, then yellow, then green
  { title: 'Document Count', sortKey: 'metrics.index_document_count.last' },
  { title: 'Data', sortKey: 'metrics.index_store_total_size.last' },
  { title: 'Index Rate', sortKey: 'metrics.index_request_rate_primary.last' },
  { title: 'Search Rate', sortKey: 'metrics.index_search_request_rate.last' },
  { title: 'Unassigned Shards', sortKey: 'metrics.index_unassigned_shards.last' }
];
const indexRowFactory = (scope, kbnUrl) => {
  const numeralize = value => numeral(value.last).format(value.metric ? value.metric.format : null);
  const unitize = value => `${numeralize(value)} ${value.metric.units}`;
  return class IndexRow extends React.Component {
    constructor(props) {
      super(props);
      this.changePath = this.changePath.bind(this);
    }
    changePath() {
      scope.$evalAsync(() => {
        kbnUrl.changePath(`/elasticsearch/indices/${this.props.name}`);
      });
    }
    render() {
      const metrics = this.props.metrics;
      const status = this.props.status;

      return (
        <KuiTableRow>
          <KuiTableRowCell>
            <KuiKeyboardAccessible>
              <a className='kuiLink' onClick={ this.changePath }>{ this.props.name }</a>
            </KuiKeyboardAccessible>
          </KuiTableRowCell>
          <KuiTableRowCell>
            <div title={ `Index status: ${status}` }>
              <ElasticsearchStatusIcon status={ status } />&nbsp;
              { capitalize(status) }
            </div>
          </KuiTableRowCell>
          <KuiTableRowCell>{ numeralize(metrics.index_document_count) }</KuiTableRowCell>
          <KuiTableRowCell>{ numeralize(metrics.index_store_total_size) }</KuiTableRowCell>
          <KuiTableRowCell>{ unitize(metrics.index_request_rate_primary) }</KuiTableRowCell>
          <KuiTableRowCell>{ unitize(metrics.index_search_request_rate) }</KuiTableRowCell>
          <KuiTableRowCell>{ numeralize(metrics.index_unassigned_shards) }</KuiTableRowCell>
        </KuiTableRow>
      );
    }
  };
};

const noDataMessage = (
  <div>
    <p>There are no indices that match your selections. Try changing the time range selection.</p>
    <p>If you are looking for system indices (e.g., .kibana), try checking 'Show system indices'.</p>
  </div>
);

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringIndexListing', kbnUrl => {
  return {
    restrict: 'E',
    scope: {
      indices: '=',
      showSystemIndices: '=',
      toggleShowSystemIndices: '='
    },
    link(scope, $el) {
      const ShowSytemIndicesCheckbox = showSystemIndicesComponentFactory(scope);
      const toolBarSection = <ShowSytemIndicesCheckbox key='toolbarSection-1' showSystemIndices={ scope.showSystemIndices }/>;

      scope.$watch('indices', (indices = []) => {
        const instancesTable = (
          <MonitoringTable
            className='indicesTable'
            rows={ indices }
            placeholder='Filter Indices...'
            filterFields={ filterFields }
            toolBarSections={ [ toolBarSection ] }
            columns={ cols }
            rowComponent={ indexRowFactory(scope, kbnUrl) }
            noDataMessage={ noDataMessage }
          />
        );
        render(instancesTable, $el[0]);
      });

    }
  };
});
