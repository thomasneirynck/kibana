import PropTypes from 'prop-types';
import React from 'react';

import { IndexActionSteps } from './index_action_steps';
import { INDEX_ACTION } from '../../lib/constants';
import {
  isResettable,
  isCancelable,
  isNotStarted,
} from '../../lib';


export function IndexTableRow({
  cancelAction,
  index,
  resetAction,
  processIndex,
}) {
  return (
    <tbody>
      <tr className="kuiTableRow">
        <td className="kuiTableRowCell">
          <div className="kuiTableRowCell__liner">
            { index.name }
          </div>
        </td>
        <td className="kuiTableRowCell">
          <div className="kuiTableRowCell__liner">
            <button
              className="kuiMenuButton kuiMenuButton--primary"
              disabled={!isNotStarted(index)}
              onClick={() => processIndex(index.name)}
            >
              { INDEX_ACTION.LABEL.REINDEX }
            </button>
          </div>
        </td>
        <td className="kuiTableRowCell kuiTableRowCell--alignRight">
          <div className="kuiTableRowCell__liner">
            <div className="kuiMenuButtonGroup kuiMenuButtonGroup--alignRight">
              <button
                className="kuiMenuButton kuiMenuButton--danger"
                disabled={!isCancelable(index)}
                onClick={() => cancelAction(index.name)}
              >
                Cancel
              </button>
              <button
                className="kuiMenuButton kuiMenuButton--basic"
                disabled={!isResettable(index)}
                onClick={() => resetAction(index.name)}
              >
                Reset
              </button>
            </div>
          </div>
        </td>
      </tr>
      {
        index.steps.length === 0
        ? null
        : (
          <tr className="kuiTableRow actionOutput">
            <td className="kuiTableRowCell kuiTableRowCell--wrap kuiTableRowCell--mergeTop" colSpan="3">
              <div className="kuiTableRowCell__liner">
                <IndexActionSteps
                  action={index.action}
                  indexName={index.name}
                  steps={index.steps}
                />
              </div>
            </td>
          </tr>
        )
      }
    </tbody>
  );
}

IndexTableRow.propTypes = {
  cancelAction: PropTypes.func,
  index: PropTypes.object,
  resetAction: PropTypes.func,
  processIndex: PropTypes.func,
};

IndexTableRow.defaultProps = {
  cancelAction: () => {},
  index: {},
  resetAction: () => {},
  processIndex: () => {},
};

