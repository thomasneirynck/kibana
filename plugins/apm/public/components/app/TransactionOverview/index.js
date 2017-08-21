import { connect } from 'react-redux';
import TransactionOverview from './view';
import { getUrlParams } from '../../../store/urlParams';
import {
  getTransactionList,
  loadTransactionList
} from '../../../store/transactionLists';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    transactionList: getTransactionList(state)
  };
}

const mapDispatchToProps = {
  loadTransactionList
};

export default connect(mapStateToProps, mapDispatchToProps)(
  TransactionOverview
);
