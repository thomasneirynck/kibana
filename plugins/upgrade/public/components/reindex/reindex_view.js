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
          <InfoGroup
            className="kuiVerticalRhythm"
            isCollapsed={ isInfoCollapsed }
            onChangeCollapsed={ toggleInfoCollapsed }
            title="Reindex Helper"
          >
            <ReindexInfo className="kuiVerticalRhythm" />
          </InfoGroup>

          {
            loadingStatus === LOADING_STATUS.FAILURE
              ? (
                <ErrorPanel className="kuiVerticalRhythm">
                  { errorMessage }
                </ErrorPanel>
              )
              : null
          }

          <IndexTable
            cancelAction={ cancelAction }
            className="kuiVerticalRhythm"
            indices={ indices }
            loadIndices={ loadIndices }
            processIndex={ processIndex }
            resetAction={ resetAction }
          />
        </div>
      </div>
    </div>
  );
});

ReindexView.propTypes = {
  cancelAction: React.PropTypes.func,
  indices: React.PropTypes.objectOf(React.PropTypes.object),
  isInfoCollapsed: React.PropTypes.bool,
  loadIndices: React.PropTypes.func,
  resetAction: React.PropTypes.func,
  processIndex: React.PropTypes.func,
  toggleInfoCollapsed: React.PropTypes.func,
  loadingStatus: React.PropTypes.string,
  errorMessage: React.PropTypes.node,
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

