import { capitalize, get } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { SORT_ASCENDING, SORT_DESCENDING } from 'monitoring-constants';
import { LARGE_FLOAT, LARGE_BYTES, LARGE_ABBREVIATED } from 'monitoring-formatting';
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
import { formatNumber } from '../../../lib/format_number';

const showSystemIndicesComponentFactory = scope => {
  return class ShowSytemIndicesCheckbox extends React.Component {
    constructor(props) {
      super();
      this.state = { showSystemIndices: props.showSystemIndices };
      this.toggleShowSystemIndices = this.toggleShowSystemIndices.bind(this);
    }
    // See also directives/shard_allocation/components/tableHead
    toggleShowSystemIndices(e) {
      const isChecked = Boolean(e.target.checked);
      this.setState({ showSystemIndices: isChecked });
      scope.$evalAsync(() => {
        scope.toggleShowSystemIndices(isChecked);
      });
    }
    render() {
      return (
        <KuiToolBarSection>
          <KuiToolBarText>
            <label className="kuiCheckBoxLabel">
              <input
                className="kuiCheckBox"
                type="checkbox"
                onChange={this.toggleShowSystemIndices}
                checked={this.state.showSystemIndices}
              />
              <span className="kuiCheckBoxLabel__text">Show system indices</span>
            </label>
          </KuiToolBarText>
        </KuiToolBarSection>
      );
    }
  };
};

/* TODO refactor other listing APIs to return metrics similar to here
 * then make this a shared function */
const formatMetric = (value, format, suffix) => {
  if (Boolean(value) || value === 0) {
    return formatNumber(value, format) + (suffix ? ' ' + suffix : '');
  }
  return 'N/A';
};

const filterFields = ['name', 'status'];
const cols = [
  { title: 'Name', sortKey: 'name', secondarySortOrder: SORT_ASCENDING },
  { title: 'Status', sortKey: 'statusSort', sortOrder: SORT_DESCENDING }, // default sort: red, then yellow, then green
  { title: 'Document Count', sortKey: 'doc_count' },
  { title: 'Data', sortKey: 'data_size' },
  { title: 'Index Rate', sortKey: 'index_rate' },
  { title: 'Search Rate', sortKey: 'search_rate' },
  { title: 'Unassigned Shards', sortKey: 'unassigned_shards' }
];
const indexRowFactory = (scope, kbnUrl) => {
  return class IndexRow extends React.Component { // eslint-disable-line react/no-multi-comp
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
      const status = this.props.status;

      return (
        <KuiTableRow>
          <KuiTableRowCell>
            <KuiKeyboardAccessible>
              <a className="kuiLink" onClick={this.changePath}>{ this.props.name }</a>
            </KuiKeyboardAccessible>
          </KuiTableRowCell>
          <KuiTableRowCell>
            <div title={`Index status: ${status}`}>
              <ElasticsearchStatusIcon status={status} />&nbsp;
              { capitalize(status) }
            </div>
          </KuiTableRowCell>
          <KuiTableRowCell>{ formatMetric(get(this.props, 'doc_count'), LARGE_ABBREVIATED) }</KuiTableRowCell>
          <KuiTableRowCell>{ formatMetric(get(this.props, 'data_size'), LARGE_BYTES) }</KuiTableRowCell>
          <KuiTableRowCell>{ formatMetric(get(this.props, 'index_rate'), LARGE_FLOAT, '/s') }</KuiTableRowCell>
          <KuiTableRowCell>{ formatMetric(get(this.props, 'search_rate'), LARGE_FLOAT, '/s') }</KuiTableRowCell>
          <KuiTableRowCell>{ formatMetric(get(this.props, 'unassigned_shards'), '0') }</KuiTableRowCell>
        </KuiTableRow>
      );
    }
  };
};

const getNoDataMessage = filterText => {
  if (filterText) {
    return (
      <div>
        <p>
          There are no indices that match your selection with the filter [{filterText.trim()}].
          Try changing the filter or the time range selection.
        </p>
        <p>
          If you are looking for system indices (e.g., .kibana), try checking &lsquo;Show system indices&rsquo;.
        </p>
      </div>
    );
  }
  return (
    <div>
      <p>There are no indices that match your selections. Try changing the time range selection.</p>
      <p>If you are looking for system indices (e.g., .kibana), try checking &lsquo;Show system indices&rsquo;.</p>
    </div>
  );
};

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringIndexListing', kbnUrl => {
  return {
    restrict: 'E',
    scope: {
      indices: '=',
      pageIndex: '=',
      filterText: '=',
      sortKey: '=',
      sortOrder: '=',
      onNewState: '=',
      showSystemIndices: '=',
      toggleShowSystemIndices: '='
    },
    link(scope, $el) {
      const ShowSytemIndicesCheckbox = showSystemIndicesComponentFactory(scope);
      const toolBarSection = (
        <ShowSytemIndicesCheckbox
          key="toolbarSection-1"
          showSystemIndices={scope.showSystemIndices}
        />
      );

      scope.$watch('indices', (indices = []) => {
        const instancesTable = (
          <MonitoringTable
            className="indicesTable"
            rows={indices}
            pageIndex={scope.pageIndex}
            filterText={scope.filterText}
            sortKey={scope.sortKey}
            sortOrder={scope.sortOrder}
            onNewState={scope.onNewState}
            placeholder="Filter Indices..."
            filterFields={filterFields}
            toolBarSections={[ toolBarSection ]}
            columns={cols}
            rowComponent={indexRowFactory(scope, kbnUrl)}
            getNoDataMessage={getNoDataMessage}
          />
        );
        render(instancesTable, $el[0]);
      });
    }
  };
});
