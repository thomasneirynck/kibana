import _ from 'lodash';
import React from 'react';
import MetricCell from './MetricCell';
import OfflineCell from './OfflineCell';
import statusIconClass from '../../lib/status_icon_class';
import extractIp from 'plugins/monitoring/lib/extract_ip';
import Table from 'plugins/monitoring/directives/paginated_table/components/table';
import uiModules from 'ui/modules';

function toggleNodesTypesFactory(scope, type) {
  return class ToggleNodesTypes extends React.Component {

    constructor(props) {
      super();
      this.state = { type, checkedState: props.checkedState };
      // methods not automatically bound to the component instance because of using ES6 class syntax
      this.toggleShowNodes = this.toggleShowNodes.bind(this, type);
      this.getTypeDisplay = this.getTypeDisplay.bind(this);
    }

    toggleShowNodes() {
      this.setState({ checkedState: !this.state.checkedState });
      scope.$evalAsync(() => {
        scope.toggleShowNodes(this.state.type);
      });
    }

    getTypeDisplay() {
      return _.capitalize(this.state.type);
    }

    render() {
      return (
        <div className='pull-left filter-member'>
          <input type='checkbox'
            onChange={this.toggleShowNodes}
            checked={this.state.checkedState}/>&nbsp;
          <span onClick={this.toggleShowNodes}>Show {this.getTypeDisplay()} nodes</span>
        </div>
      );
    }

  };
}

function nodeRowFactory(scope, kbnUrl, decorateRow) {
  function checkOnline(status) {
    return status === 'green';
  }

  function getStatus(val) {
    if (val === 'Online') {
      return 'green';
    }
    return 'offline';
  }

  return class NodeRow extends React.Component {

    constructor(props) {
      super();
      const row = _.find(scope.rows, {resolver: props.resolver});
      this.state = decorateRow(row);
      this.goToNode = this.goToNode.bind(this);
    }

    componentWillReceiveProps(newProps) {
      const row = _.find(scope.rows, {resolver: newProps.resolver});
      this.setState(decorateRow(row));
    }

    goToNode() {
      scope.$evalAsync(() => {
        kbnUrl.changePath(`/elasticsearch/nodes/${this.state.resolver}`);
      });
    }

    render() {
      const status = getStatus(this.state.status);
      const isOnline = checkOnline(status);
      return (
        <tr key={`row-${this.state.resolver}`} className='big'>
          <td key={`name-${this.state.resolver}`}>
            <i title={this.state.node.nodeTypeLabel} className={`fa ${this.state.node.nodeTypeClass}`}/>
            &nbsp;
            <a onClick={this.goToNode}>
              {this.state.node.name}
            </a>
            <div className='small'>{extractIp(this.state.node.transport_address)}</div>
          </td>
          <td status={`name-${this.state.resolver}`}>
            <span className={`status status-${status}`}>
              <i className={statusIconClass(status)} title={_.capitalize(status)}/>
            </span>
          </td>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_cpu_utilization}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_jvm_mem_percent}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_load_average}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_free_space}></MetricCell>
          {(() => {
            if (isOnline) {
              return (
                <td shards={`name-${this.state.resolver}`}>
                  <div className='big inline'>
                    {this.state.metrics.shard_count}
                  </div>
                </td>
              );
            }
            return <OfflineCell key='shards'/>;
          }())}
        </tr>
      );
    }

  };
}

// change the node to actually display the name
const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringNodesListing', function (kbnUrl) {
  const initialTableOptions = {
    title: 'Nodes',
    searchPlaceholder: 'Filter Nodes',
    /* "key" should be an object
     *   - unless it's the "name" key
     *   - the key object should have:
     *      - "metric" object
     *      - "last" scalar
     * "sortKey" should be a scalar */
    columns: [
      {
        key: 'nodeName',
        sortKey: 'nodeName',
        sort: 1,
        title: 'Name'
      },
      {
        key: 'status',
        sortKey: 'online',
        title: 'Status'
      },
      {
        key: 'metrics.node_cpu_utilization',
        sortKey: 'metrics.node_cpu_utilization.last',
        title: 'CPU Usage'
      },
      {
        key: 'metrics.node_jvm_mem_percent',
        sortKey: 'metrics.node_jvm_mem_percent.last',
        title: 'JVM Memory'
      },
      {
        key: 'metrics.node_load_average',
        sortKey: 'metrics.node_load_average.last',
        title: 'Load Average'
      },
      {
        key: 'metrics.node_free_space',
        sortKey: 'metrics.node_free_space.last',
        title: 'Disk Free Space'
      },
      {
        key: 'metrics.shard_count',
        title: 'Shards'
      }
    ]
  };

  return {
    restrict: 'E',
    scope: {
      cluster: '=',
      rows: '=',
      showMasterNodes: '=',
      showDataNodes: '=',
      showClientNodes: '=',
      toggleShowNodes: '='
    },
    link(scope, $el) {

      function decorateRow(row) {
        if (!row) return null;
        row.nodeName = _.get(row, 'node.name');
        row.type = _.get(row, 'node.type');
        row.transport_address = _.get(row, 'node.transport_address');
        row.status = row.online ? 'Online' : 'Offline';
        return row;
      }

      const ToggleMasterNodes = toggleNodesTypesFactory(scope, 'master');
      const ToggleDataNodes = toggleNodesTypesFactory(scope, 'data');
      const ToggleClientNodes = toggleNodesTypesFactory(scope, 'client');
      const NodeRow = nodeRowFactory(scope, kbnUrl, decorateRow);
      const $table = React.createElement(Table, {
        scope,
        options: initialTableOptions,
        filterMembers: [
          <ToggleMasterNodes checkedState={scope.showMasterNodes}/>,
          <ToggleDataNodes checkedState={scope.showDataNodes}/>,
          <ToggleClientNodes checkedState={scope.showClientNodes}/>
        ],
        template: NodeRow
      });
      const tableInstance = React.render($table, $el[0]);
      scope.$watch('rows', (rows) => {
        tableInstance.setData(rows.map((row) => decorateRow(row)));
      });

    }
  };
});
