import { connect } from 'react-redux';
import { IndexList as PresentationComponent } from './index_list';

import {
  loadIndices,
  reloadIndices
} from '../../../../store/actions';

const mapDispatchToProps = (dispatch) => {
  return {
    loadIndices: () => {
      dispatch(loadIndices());
    },
    reloadIndices: () => {
      dispatch(reloadIndices());
    }
  };
};

export const IndexList = connect(null, mapDispatchToProps)(PresentationComponent);
