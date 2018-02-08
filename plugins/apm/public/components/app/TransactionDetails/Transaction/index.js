import { connect } from 'react-redux';
import Transaction from './view';
import { getUrlParams } from '../../../../store/urlParams';
import { loadTransaction, getTransaction } from '../../../../store/transaction';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    transaction: getTransaction(state),
    location: state.location
  };
}

const mapDispatchToProps = {
  loadTransaction
};
export default connect(mapStateToProps, mapDispatchToProps)(Transaction);
