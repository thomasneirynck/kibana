import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { EuiText, EuiTitle, EuiLink, EuiSpacer, EuiSwitch } from '@elastic/eui';
import { uiModules } from 'ui/modules';
import { KuiTableRowCell, KuiTableRow, KuiToolBarSection, KuiToolBarText } from '@kbn/ui-framework/components';
import { MonitoringTable } from 'plugins/monitoring/components/table';
import { parseProps } from './parse_props';
import {
  RecoveryIndex,
  TotalTime,
  SourceDestination,
  FilesProgress,
  BytesProgress,
  TranslogProgress
} from 'plugins/monitoring/components/elasticsearch/shard_activity';

const columns = [
  { title: 'Index', sortKey: null },
  { title: 'Stage', sortKey: null },
  { title: 'Total Time', sortKey: null },
  { title: 'Source / Destination', sortKey: null },
  { title: 'Files', sortKey: null },
  { title: 'Bytes', sortKey: null },
  { title: 'Translog', sortKey: null }
];
const activityRowFactory = () => {
  return props => {
    return (
      <KuiTableRow>
        <KuiTableRowCell>
          <RecoveryIndex {...props} />
        </KuiTableRowCell>
        <KuiTableRowCell>
          {props.stage}
        </KuiTableRowCell>
        <KuiTableRowCell>
          <TotalTime {...props} />
        </KuiTableRowCell>
        <KuiTableRowCell>
          <SourceDestination {...props} />
        </KuiTableRowCell>
        <KuiTableRowCell>
          <FilesProgress {...props} />
        </KuiTableRowCell>
        <KuiTableRowCell>
          <BytesProgress {...props} />
        </KuiTableRowCell>
        <KuiTableRowCell>
          <TranslogProgress {...props} />
        </KuiTableRowCell>
      </KuiTableRow>
    );
  };
};

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringShardActivity', () => {
  return {
    restrict: 'E',
    scope: {
      data: '=',
      onlyActive: '=?'
    },
    link(scope, $el) {
      scope.showHistory = false;
      const filterData = (data, showHistory) => {
        return data.filter(row => {
          return showHistory || row.stage !== 'DONE';
        });
      };

      const toggleHistory = () => {
        scope.$evalAsync(() => {
          scope.showHistory = !scope.showHistory;
        });
      };

      const renderToolBarSection = () => (
        <KuiToolBarSection>
          <KuiToolBarText>
            <EuiSwitch
              label="Completed recoveries"
              onChange={toggleHistory}
              checked={scope.showHistory}
            />
          </KuiToolBarText>
        </KuiToolBarSection>
      );

      const getNoDataMessage = () => {
        if (scope.showHistory) {
          return 'There are no historical shard activity records for the selected time range.';
        }
        return (
          <Fragment>
            There are no active shard recoveries for this cluster.<br />
            Try viewing <EuiLink onClick={toggleHistory}>completed recoveries</EuiLink>.
          </Fragment>
        );
      };

      // tableData is an array of table row data, or null
      const renderTable = (tableData) => {
        const rows = tableData === null ? null : tableData.map(parseProps);
        render(
          <Fragment>
            <EuiText>
              <EuiTitle size="s">
                <h2>Shard Activity</h2>
              </EuiTitle>
            </EuiText>
            <EuiSpacer />
            <MonitoringTable
              className="esShardActivityTable"
              rows={rows}
              renderToolBarSections={renderToolBarSection}
              columns={columns}
              rowComponent={activityRowFactory()}
              getNoDataMessage={getNoDataMessage}
              alwaysShowPageControls={true}
            />
          </Fragment>,
          $el[0]
        );
      };

      scope.$watch('data', data => {
        renderTable(filterData(data, scope.showHistory));
      });

      // HACK to force table to re-render even if data hasn't changed. This
      // happens when the data remains empty after turning on showHistory. The
      // button toggle needs to update the "no data" message
      scope.$watch('showHistory', showHistory => {
        renderTable(null); // effectively causes table to show the loading message temporarily
        renderTable(filterData(scope.data, showHistory));
      });
    }
  };
});
