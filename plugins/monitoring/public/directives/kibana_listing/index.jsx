import _ from 'lodash';
import numeral from 'numeral';
import React from 'react';
import statusIconClass from '../../lib/status_icon_class';

const module = require('ui/modules').get('monitoring/directives', []);
const Table = require('plugins/monitoring/directives/paginated_table/components/table');

function getStatusAndClasses(value, availability) {
  if (availability === false) {
    return {
      status: 'Offline',
      statusClass: 'status-offline',
      iconClass: statusIconClass('offline')
    };
  }
  return {
    status: _.capitalize(value),
    statusClass: `status-${value}`,
    iconClass: statusIconClass(value)
  };
}
module.directive('monitoringKibanaListing', function (kbnUrl) {
  const initialTableOptions = {
    title: 'Kibana',
    searchPlaceholder: 'Filter Instances',
    columns: [
      {
        key: 'kibana.name',
        sortKey: 'kibana.name',
        sort: 1,
        title: 'Name'
      },
      {
        key: 'kibana.status',
        sortKey: 'kibana.status',
        title: 'Status'
      },
      {
        key: 'process.memory',
        sortKey: 'process.memory.resident_set_size_in_bytes',
        title: 'Memory Size'
      },
      {
        key: 'os.load',
        sortKey: 'os.load.1m',
        title: 'Load Average'
      },
      {
        key: 'requests.total',
        sortKey: 'requests.total',
        title: 'Requests'
      },
      {
        key: 'response_times',
        sortKey: 'response_times.average',
        title: 'Response Times'
      }
    ]
  };

  return {
    restrict: 'E',
    scope: { rows: '=' },
    link: function (scope, $el) {
      const tableRowTemplate = React.createClass({
        getInitialState: function () {
          return _.find(scope.rows, {resolver: this.props.resolver}) || null;
        },
        componentWillReceiveProps: function (newProps) {
          this.setState(newProps);
        },
        render: function () {
          // const boundTemplateFn = _.bind(makeTdWithPropKey, this, scope);
          // const $tdsArr = initialTableOptions.columns.map(boundTemplateFn);
          // return make.tr({}, $tdsArr);
          const { status, statusClass, iconClass } = getStatusAndClasses(this.props.kibana.status, this.props.availability);
          return (
            <tr key={`row-${this.props.resolver}`} className='big'>
              <td>
                <a onClick={() => {
                  scope.$evalAsync(() => {
                    kbnUrl.changePath('/kibana/' + _.get(this.props, 'kibana.uuid'));
                  });
                }}>
                  <div>{this.props.kibana.name}</div>
                </a>
                <div className="small">{_.get(this.props, 'kibana.transport_address')}</div>
              </td>
              <td>
                <span className={`status ${statusClass}`}>
                  <i className={iconClass} title={_.capitalize(status)}></i>
                </span>
              </td>
              <td>
                <div className='big'>
                    {`${numeral(this.props.process.memory.resident_set_size_in_bytes).format('0.00 b')}`}
                </div>
              </td>
              <td>
                <div className='big'>
                  {`${numeral(this.props.os.load['1m']).format('0.00')}`}
                </div>
              </td>
              <td>
                <div className='big'>{this.props.requests.total}</div>
              </td>
              <td>
                <div>
                  <div>{this.props.response_times.average && (numeral(this.props.response_times.average).format('0') + ' ms avg')}</div>
                  <div>{numeral(this.props.response_times.max).format('0')} ms max</div>
                </div>
              </td>
            </tr>
          );
        }
      });

      const $table = React.createElement(Table, {
        options: initialTableOptions,
        template: tableRowTemplate
      });
      const tableInstance = React.render($table, $el[0]);
      scope.$watch('rows', function (rows) {
        tableInstance.setData(rows);
      });
    }
  };
});
