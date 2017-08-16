import { connect } from 'react-redux';
import Transaction from './index';
import { getUrlParams } from '../../../../store/urlParams';
import {
  loadTransaction,
  getTransaction
} from '../../../../store/transactions';

function mapStateToProps(state = {}) {
  const transaction = getTransaction(state);
  const urlParams = getUrlParams(state);

  return {
    urlParams,
    transaction
  };
}

const mapDispatchToProps = {
  loadTransaction
};
export default connect(mapStateToProps, mapDispatchToProps)(Transaction);
