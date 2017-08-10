import { connect } from 'react-redux';
import { STATUS } from '../../../../constants';
import Transaction from './index';
import { getUrlParams } from '../../../../store/urlParams';
import {
  loadTransaction,
  getTransaction
} from '../../../../store/transactions';

import PRIORITIZED_PROPERTIES from './prioritizedProperties.json';

function getTabs(transaction) {
  if (transaction.status !== STATUS.SUCCESS) {
    return [];
  }
  return PRIORITIZED_PROPERTIES.filter(
    ({ key, required }) => required || transaction.data.context[key]
  ).map(({ key }) => key);
}

// Ensure the chosen tab exists. Defaults to "timeline"
function getValidTransactionTab(tabs = [], transactionTab) {
  return tabs.includes(transactionTab) ? transactionTab : 'timeline';
}

function mapStateToProps(state = {}) {
  const transaction = getTransaction(state);
  const urlParams = getUrlParams(state);
  const tabs = getTabs(transaction);
  const transactionTab = getValidTransactionTab(tabs, urlParams.transactionTab);

  return {
    tabs,
    transactionTab,
    urlParams,
    transaction
  };
}

const mapDispatchToProps = {
  loadTransaction
};
export default connect(mapStateToProps, mapDispatchToProps)(Transaction);
