import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import MetricCell from './metric_cell_component';
import OfflineCell from './offline_cell_component';
import { statusIconClass } from 'plugins/monitoring/lib/map_status_classes';
import Tooltip from 'plugins/monitoring/lib/tooltip_component';
import extractIp from 'plugins/monitoring/lib/extract_ip';
import Table from 'plugins/monitoring/directives/paginated_table/components/table';
import uiModules from 'ui/modules';

function nodeRowFactory(scope, kbnUrl, createRow) {
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
      const rowData = _.find(scope.rows, {resolver: props.resolver});
      this.state = createRow(rowData);
      this.goToNode = this.goToNode.bind(this);
    }

    componentWillReceiveProps(newProps) {
      if (!_.isEqual(newProps, this.props)) {
        const rowData = _.find(scope.rows, {resolver: newProps.resolver});
        this.setState(createRow(rowData));
      }
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
        <tr className='big'>
          <td>
            <Tooltip text={this.state.node.nodeTypeLabel} trigger='hover' placement='bottom'>
              <span className={`fa ${this.state.node.nodeTypeClass}`}></span>
            </Tooltip>
            &nbsp;
            <a className='link' onClick={this.goToNode}>
              {this.state.node.name}
            </a>
            <div className='small'>{extractIp(this.state.node.transport_address)}</div>
          </td>
          <td>
            <span className={`status status-${status}`}>
              <span className={statusIconClass(status)} title={_.capitalize(status)}></span>
            </span>
          </td>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_cpu_utilization}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_jvm_mem_percent}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_load_average}></MetricCell>
          <MetricCell isOnline={isOnline} metric={this.state.metrics.node_free_space}></MetricCell>
          {(() => {
            if (isOnline) {
              return (
                <td>
                  <div className='big inline'>
                    {this.state.metrics.shard_count}
                  </div>
                </td>
              );
            }
            return <OfflineCell/>;
          })()}
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
    filterFields: ['nodeName', 'status', 'type', 'transport_address'],
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
      rows: '='
    },
    link(scope, $el) {

      function createRow(rowData) {
        if (!rowData) return null;

        return {
          nodeName: _.get(rowData, 'node.name'),
          status: rowData.online ? 'Online' : 'Offline',
          ...rowData
        };
      }

      const NodeRow = nodeRowFactory(scope, kbnUrl, createRow);
      const $table = React.createElement(Table, {
        scope,
        options: initialTableOptions,
        template: NodeRow
      });
      const tableInstance = ReactDOM.render($table, $el[0]);
      scope.$watch('rows', (rows) => {
        tableInstance.setData(rows.map((rowData) => createRow(rowData)));
      });

    }
  };
});
