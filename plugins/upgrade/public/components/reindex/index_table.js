import { sortBy } from 'lodash';
import classNames from 'classnames';
import React from 'react';

import { RefreshButton } from '../refresh_button';
import { KuiToolBar } from 'ui_framework/components';
import { IndexTableRow } from './index_table_row';


export function IndexTable({
  cancelAction,
  className,
  indices,
  loadIndices,
  processIndex,
  resetAction,
}) {
  const classes = classNames('kuiControlledTable', className);
  const sortedIndices = sortBy(indices, 'name');

  return (
    <div className={ classes }>
      <KuiToolBar>
        <div className="kuiToolBarSection">

          <RefreshButton
            buttonLabel="Refresh Indices"
            onClick={ loadIndices }
          />

        </div>
        <div className="kuiToolBarSection">
          <div className="kuiToolBarText">
            { sortedIndices.length } indices
          </div>
        </div>
      </KuiToolBar>
      <table className="kuiTable">
        <thead>
          <tr>
            <th className="kuiTableHeaderCell">
              Index Name
            </th>
            <th className="kuiTableHeaderCell">
              Required Action
            </th>
            <th className="kuiTableHeaderCell kuiTableHeaderCell--alignRight">
              Task Management
            </th>
          </tr>
        </thead>
        { sortedIndices.map((index) => (
          <IndexTableRow
            cancelAction={ cancelAction }
            index={ index }
            key={ index.name }
            resetAction={ resetAction }
            processIndex={ processIndex }
          />
        )) }
      </table>
    </div>
  );
}

IndexTable.propTypes = {
  cancelAction: React.PropTypes.func,
  className: React.PropTypes.string,
  indices: React.PropTypes.objectOf(React.PropTypes.object),
  loadIndices: React.PropTypes.func,
  resetAction: React.PropTypes.func,
  processIndex: React.PropTypes.func,
};

IndexTable.defaultProps = {
  cancelAction: () => {},
  className: '',
  indices: {},
  loadIndices: () => {},
  resetAction: () => {},
  processIndex: () => {},
};

