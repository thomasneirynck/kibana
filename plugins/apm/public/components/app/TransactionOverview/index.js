import { connect } from 'react-redux';
import TransactionOverview from './view';
import { getUrlParams } from '../../../store/urlParams';
import { changeTransactionSorting } from '../../../store/transactionSorting';
import {
  getTransactionList,
  loadTransactionList
} from '../../../store/transactionLists';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    transactionList: getTransactionList(state),
    transactionSorting: state.transactionSorting
  };
}

const mapDispatchToProps = {
  loadTransactionList,
  changeTransactionSorting
};

export default connect(mapStateToProps, mapDispatchToProps)(
  TransactionOverview
);
