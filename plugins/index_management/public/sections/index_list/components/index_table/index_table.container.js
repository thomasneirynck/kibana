import { connect } from 'react-redux';
import {
  getDetailPanelIndexName,
  getPageOfIndices,
  getPager,
  getFilter,
  isDetailPanelOpen,
  showSystemIndices,
  getSortField,
  isSortAscending
} from '../../../../store/selectors';
import {
  filterChanged,
  closeDetailPanel,
  openDetailPanel,
  pageChanged,
  pageSizeChanged,
  sortChanged,
  showSystemIndicesChanged,
} from '../../../../store/actions';

import { IndexTable as PresentationComponent } from './index_table';

const mapStateToProps = (state) => {
  return {
    isDetailPanelOpen: isDetailPanelOpen(state),
    detailPanelIndexName: getDetailPanelIndexName(state),
    indices: getPageOfIndices(state),
    pager: getPager(state),
    filter: getFilter(state),
    showSystemIndices: showSystemIndices(state),
    sortField: getSortField(state),
    isSortAscending: isSortAscending(state)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    filterChanged: (filter) => {
      dispatch(filterChanged({ filter }));
    },
    pageChanged: (pageNumber) => {
      dispatch(pageChanged({ pageNumber }));
    },
    pageSizeChanged: (pageSize) => {
      dispatch(pageSizeChanged({ pageSize }));
    },
    sortChanged: (sortField, isSortAscending) => {
      dispatch(sortChanged({ sortField, isSortAscending }));
    },
    showSystemIndicesChanged: (showSystemIndices) => {
      dispatch(showSystemIndicesChanged({ showSystemIndices }));
    },
    openDetailPanel: (indexName) => {
      dispatch(openDetailPanel({ indexName }));
    },
    closeDetailPanel: () => {
      dispatch(closeDetailPanel());
    }
  };
};

export const IndexTable = connect(
  mapStateToProps,
  mapDispatchToProps
)(PresentationComponent);
