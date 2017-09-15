import { combineReducers } from 'redux';

import appLists from './appLists';
import apps from './apps';
import charts from './charts';
import errorDistributions from './errorDistributions';
import errorGroupLists from './errorGroupLists';
import errorGroups from './errorGroups';
import errorGroupSorting from './errorGroupSorting';
import license from './license';
import location from './location';
import traces from './traces';
import transactionDistributions from './transactionDistributions';
import transactionLists from './transactionLists';
import transactions from './transactions';
import transactionSorting from './transactionSorting';
import urlParams from './urlParams';

const appReducer = combineReducers({
  appLists,
  apps,
  charts,
  errorDistributions,
  errorGroupLists,
  errorGroups,
  errorGroupSorting,
  license,
  location,
  traces,
  transactionDistributions,
  transactionLists,
  transactions,
  transactionSorting,
  urlParams
});

// This adds support for clearing the redux store, eg. via an interval, to avoid stale data.
const rootReducer = (state, action) => {
  let newState = { ...state };
  if (action.type === 'RESET_STATE') {
    newState = {
      ...state,
      errorGroupLists: undefined,
      errorGroups: undefined,
      transactionLists: undefined,
      app: undefined,
      apps: undefined
    };
  }

  return appReducer(newState, action);
};

export default rootReducer;
