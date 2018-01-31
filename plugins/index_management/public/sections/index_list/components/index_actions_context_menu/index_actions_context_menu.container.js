import { connect } from 'react-redux';
import { IndexActionsContextMenu as PresentationComponent } from './index_actions_context_menu';
import {
  clearCacheIndices,
  closeIndices,
  deleteIndices,
  flushIndices,
  forcemergeIndices,
  openIndices,
  editIndexSettings,
  refreshIndices,
  openDetailPanel
} from '../../../../store/actions';

import {
  getIndexStatusByIndexName
} from '../../../../store/selectors';

const mapStateToProps = (state, ownProps) => {
  const indexStatusByName = {};
  const { indexNames } = ownProps;
  indexNames.forEach((indexName) => {
    indexStatusByName[indexName] = getIndexStatusByIndexName(state, indexName);
  });
  return {
    indexStatusByName
  };
};

const mapDispatchToProps = (dispatch, { indexNames }) => {
  return {
    editIndexSettings: () => {
      dispatch(editIndexSettings({ indexName: indexNames[0] }));
    },
    clearCacheIndices: () => {
      dispatch(clearCacheIndices({ indexNames: indexNames }));
    },
    closeIndices: () => {
      dispatch(closeIndices({ indexNames: indexNames }));
    },
    flushIndices: () => {
      dispatch(flushIndices({ indexNames: indexNames }));
    },
    openIndices: () => {
      dispatch(openIndices({ indexNames: indexNames }));
    },
    refreshIndices: () => {
      dispatch(refreshIndices({ indexNames: indexNames }));
    },
    forcemergeIndices: () => {
      dispatch(forcemergeIndices({ indexNames: indexNames }));
    },
    showSettings: () => {
      dispatch(openDetailPanel({ indexName: indexNames[0], panelType: 'Settings' }));
    },
    showMapping: () => {
      dispatch(openDetailPanel({ indexName: indexNames[0], panelType: 'Mapping' }));
    },
    showStats: () => {
      dispatch(openDetailPanel({ indexName: indexNames[0], panelType: 'Stats' }));
    },
    editIndex: () => {
      const indexName = indexNames ? indexNames[0] : null;
      if (indexName) {
        dispatch(openDetailPanel({ indexName, panelType: 'Edit settings' }));
      }
    },
    deleteIndices: () => {
      dispatch(deleteIndices({ indexNames }));
    }
  };
};

export const IndexActionsContextMenu = connect(mapStateToProps, mapDispatchToProps)(PresentationComponent);
