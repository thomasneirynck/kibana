import { connect } from 'react-redux';
import view from './view';
import { some, get } from 'lodash';
import { STATUS } from '../../../../constants/index';

function getIsLoading(state) {
  return some(state, subState => get(subState, 'status') === STATUS.LOADING);
}

function mapStateToProps(state = {}) {
  return {
    isLoading: getIsLoading(state)
  };
}

export default connect(mapStateToProps)(view);
