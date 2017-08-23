import { capitalize } from 'lodash';
import React from 'react';
import { render } from 'react-dom';
import { uiModules } from 'ui/modules';
import { KuiTableRowCell, KuiTableRow } from 'ui_framework/components';
import { MonitoringTable } from 'plugins/monitoring/components/table';
import { SORT_DESCENDING } from 'monitoring-constants';
import { Tooltip } from 'plugins/monitoring/components/tooltip';
import { FormattedMessage } from 'plugins/monitoring/components/alerts/formatted_message';
import { SeverityIcon } from 'plugins/monitoring/components/alerts/severity_icon';
import { formatDateTimeLocal } from 'monitoring-formatting';

const filterFields = [ 'message', 'severity_group', 'prefix', 'suffix', 'since', 'timestamp', 'update_timestamp' ];
const columns = [
  { title: 'Status', sortKey: 'metadata.severity', sortOrder: SORT_DESCENDING },
  { title: 'Message', sortKey: 'message' },
  { title: 'Last Checked', sortKey: 'update_timestamp' },
  { title: 'Since', sortKey: 'timestamp' }
];
const alertRowFactory = (scope, kbnUrl) => {
  return props => {
    const angularChangeUrl = target => {
      scope.$evalAsync(() => {
        kbnUrl.changePath(target);
      });
    };

    return (
      <KuiTableRow>
        <KuiTableRowCell>
          <Tooltip text={`${capitalize(props.severity_group)} severity alert`} placement="bottom" trigger="hover">
            <SeverityIcon severity={props.metadata.severity} />
          </Tooltip>
        </KuiTableRowCell>
        <KuiTableRowCell>
          <FormattedMessage
            prefix={props.prefix}
            suffix={props.suffix}
            message={props.message}
            metadata={props.metadata}
            angularChangeUrl={angularChangeUrl}
          />
        </KuiTableRowCell>
        <KuiTableRowCell>
          { formatDateTimeLocal(props.update_timestamp) }
        </KuiTableRowCell>
        <KuiTableRowCell>
          { props.since } ago
        </KuiTableRowCell>
      </KuiTableRow>
    );
  };
};

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterAlertsListing', kbnUrl => {
  return {
    restrict: 'E',
    scope: { alerts: '=' },
    link(scope, $el) {

      scope.$watch('alerts', (alerts = []) => {
        const alertsTable = (
          <MonitoringTable
            className="alertsTable"
            rows={alerts}
            placeholder="Filter Alerts..."
            filterFields={filterFields}
            columns={columns}
            rowComponent={alertRowFactory(scope, kbnUrl)}
          />
        );
        render(alertsTable, $el[0]);
      });

    }
  };
});
