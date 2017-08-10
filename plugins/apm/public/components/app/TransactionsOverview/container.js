import { connect } from 'react-redux';
import TransactionsOverview from './index';
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
  TransactionsOverview
);
