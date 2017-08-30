import PropTypes from 'prop-types';
import React from 'react';

import { IndexTable } from './index_table';
import { ReindexInfo } from './info';
import { InfoGroup } from '../info_group';
import { withViewState } from '../../lib/util/view_state';
import { ErrorPanel } from '../error_panel';
import { LOADING_STATUS } from '../../lib/constants';


export const ReindexView = withViewState({
  initialState: {
    isInfoCollapsed: false,
  },
  updaters: {
    toggleInfoCollapsed: (state) => () => ({
      isInfoCollapsed: !state.isInfoCollapsed,
    }),
  },
})(function ReindexView({
  cancelAction,
  indices,
  isInfoCollapsed,
  loadIndices,
  resetAction,
  processIndex,
  toggleInfoCollapsed,
  loadingStatus,
  errorMessage,
}) {
  return (
    <div className="kuiView">
      <div className="kuiViewContent kuiViewContent--constrainedWidth">
        <div className="kuiViewContentItem">
          {
            loadingStatus === LOADING_STATUS.FORBIDDEN
              ? (
                <ErrorPanel
                  className="kuiVerticalRhythm"
                  title="You do not have permission to use the Upgrade Assistant."
                >
                  <p className="kuiText">Please contact your administrator.</p>
                </ErrorPanel>
              )
              : null
          }

          <InfoGroup
            className="kuiVerticalRhythm"
            isCollapsed={isInfoCollapsed}
            onChangeCollapsed={toggleInfoCollapsed}
            title="Reindex Helper"
          >
            <ReindexInfo className="kuiVerticalRhythm" />
          </InfoGroup>

          {
            loadingStatus === LOADING_STATUS.FAILURE
              ? (
                <ErrorPanel className="kuiVerticalRhythm">
                  {errorMessage}
                </ErrorPanel>
              )
              : null
          }

          {
            loadingStatus === LOADING_STATUS.SUCCESS
              ? (
                <IndexTable
                  cancelAction={cancelAction}
                  className="kuiVerticalRhythm"
                  indices={indices}
                  loadIndices={loadIndices}
                  processIndex={processIndex}
                  resetAction={resetAction}
                />
              )
              : null
          }
        </div>
      </div>
    </div>
  );
});

ReindexView.propTypes = {
  cancelAction: PropTypes.func,
  indices: PropTypes.objectOf(PropTypes.object),
  isInfoCollapsed: PropTypes.bool,
  loadIndices: PropTypes.func,
  resetAction: PropTypes.func,
  processIndex: PropTypes.func,
  toggleInfoCollapsed: PropTypes.func,
  loadingStatus: PropTypes.string,
  errorMessage: PropTypes.node,
};

ReindexView.defaultProps = {
  cancelAction: () => {},
  indices: {},
  loadIndices: () => {},
  resetAction: () => {},
  processIndex: () => {},
  loadingStatus: '',
  errorMessage: '',
};

