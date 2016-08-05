import _ from 'lodash';
import React from 'react';
import MetricCell from './MetricCell';
import OfflineCell from './OfflineCell';
import statusIconClass from '../../lib/status_icon_class';
import extractIp from 'plugins/monitoring/lib/extract_ip';
import Table from 'plugins/monitoring/directives/paginated_table/components/table';
import uiModules from 'ui/modules';

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
    scope: { cluster: '=', rows: '=' },
    link: function (scope, $el) {
      function decorateRow(row) {
        if (!row) return null;
        row.nodeName = _.get(row, 'node.name');
        row.type = _.get(row, 'node.type');
        row.transport_address = _.get(row, 'node.transport_address');
        row.status = row.online ? 'Online' : 'Offline';
        return row;
      }

      function goToNode(resolver) {
        scope.$evalAsync(function () {
          kbnUrl.changePath(`/elasticsearch/nodes/${resolver}`);
        });
      }

      function checkOnline(status) {
        return status === 'green';
      }

      function getStatus(val) {
        if (val === 'Online') {
          return 'green';
        }
        return 'offline';
      }

      const nodeRowTemplate = React.createClass({
        getInitialState() {
          const row = _.find(scope.rows, {resolver: this.props.resolver});
          return decorateRow(row);
        },

        componentWillReceiveProps(newProps) {
          const row = _.find(scope.rows, {resolver: newProps.resolver});
          this.setState(decorateRow(row));
        },

        render() {
          const status = getStatus(this.props.status);
          const isOnline = checkOnline(status);
          return (
            <tr key={`row-${this.props.resolver}`} className='big'>
              <td key={`name-${this.props.resolver}`}>
                <i title={this.props.node.nodeTypeLabel} className={`fa ${this.props.node.nodeTypeClass}`}/>
                &nbsp;
                <a onClick={_.partial(goToNode, this.state.resolver)}>
                  {this.state.node.name}
                </a>
                <div className='small'>{extractIp(this.state.node.transport_address)}</div>
              </td>
              <td status={`name-${this.props.resolver}`}>
                <span className={`status status-${status}`}>
                  <i className={statusIconClass(status)} title={_.capitalize(status)}/>
                </span>
              </td>
              <MetricCell isOnline={isOnline} metric={this.props.metrics.node_cpu_utilization}></MetricCell>
              <MetricCell isOnline={isOnline} metric={this.props.metrics.node_jvm_mem_percent}></MetricCell>
              <MetricCell isOnline={isOnline} metric={this.props.metrics.node_load_average}></MetricCell>
              <MetricCell isOnline={isOnline} metric={this.props.metrics.node_free_space}></MetricCell>
              {(() => {
                if (isOnline) {
                  return (
                    <td shards={`name-${this.props.resolver}`}>
                      <div className='big inline'>
                        {this.props.metrics.shard_count}
                      </div>
                    </td>
                  );
                }
                return <OfflineCell key='shards'/>;
              }())}
            </tr>
          );
        }
      });

      const tableFactory = React.createFactory(Table);
      const table = React.render(tableFactory({
        scope,
        options: initialTableOptions,
        template: nodeRowTemplate
      }), $el[0]);

      scope.$watch('rows', (rows) => {
        table.setData(rows.map(function (row) {
          return decorateRow(row);
        }));
      });
    }
  };
});
