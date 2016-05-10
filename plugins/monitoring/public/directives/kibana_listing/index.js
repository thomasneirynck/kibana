define(function (require) {
  const _ = require('lodash');
  const numeral = require('numeral');
  const module = require('ui/modules').get('monitoring/directives', []);
  const React = require('react');
  const make = React.DOM;

  const Table = require('plugins/monitoring/directives/paginated_table/components/table');

  function getStatusAndClasses(value, availability) {
    const iconMapping = {
      'green': 'fa-check',
      'yellow': 'fa-warning',
      'red': 'fa-bolt'
    };

    if (availability === false) {
      return {
        status: 'Offline',
        statusClass: 'offline',
        iconClass: 'offline'
      };
    }
    return {
      status: _.capitalize(value),
      statusClass: `status-${value}`,
      iconClass: iconMapping[value]
    };
  }
  module.directive('monitoringKibanaListing', function (kbnUrl) {
    function makeTdWithPropKey(scope, dataKey, idx) {
      let value = _.get(this.props, dataKey.key);
      let $content = null;

      if (value instanceof(Array)) value = value.join(', ');
      switch (dataKey.key) {
        case 'kibana.name':
          $content = (
            <div key="idx">
              <a onClick={() => {
                scope.$evalAsync(() => {
                  kbnUrl.changePath('/kibana/' + _.get(this.props, 'kibana.uuid'));
                });
              }}>
                <div>{value}</div>
              </a>
              <div className="small">{_.get(this.props, 'kibana.transport_address')}</div>
            </div>
          );
          break;
        case 'kibana.status':
          const { status, statusClass, iconClass } = getStatusAndClasses(value, this.props.availability);
          $content = (
            <div className={`big kibana-status ${statusClass}`}>
              {status}
              <i className={`fa ${iconClass}`}></i>
            </div>
          );
          break;
        case 'process.memory.heap':
          $content = (
            <div className="big">
                {`${numeral(value.used_in_bytes).format('0.00 b')}`}
            </div>
          );
          break;
        case 'response_times':
          $content = (
            <div>
              <div>{value.average && (numeral(value.average).format('0') + ' ms avg')}</div>
              <div>{numeral(value.max).format('0')} ms max</div>
            </div>
          );
          break;
        case 'os.load':
          $content = (
            <div className="big">
              {`${numeral(value['1m']).format('0.00')}`}
            </div>
          );
          break;
        case 'requests.total':
          $content = (
            <div className="big">{value}</div>
          );
          break;

      }
      return make.td({key: idx}, $content || value);
    }

    const initialTableOptions = {
      title: 'Kibana',
      searchPlaceholder: 'Filter Servers',
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
          key: 'process.memory.heap',
          sortKey: 'process.memory.heap.used_in_bytes',
          title: 'Memory Heap Used'
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
            const boundTemplateFn = _.bind(makeTdWithPropKey, this, scope);
            const $tdsArr = initialTableOptions.columns.map(boundTemplateFn);
            return make.tr({
              className: 'big no-border',
              key: `row-${this.props.resolver}`
            }, $tdsArr);
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
});
