import { combineReducers } from 'redux';

import appLists from './appLists';
import apps from './apps';
import charts from './charts';
import distributions from './distributions';
import errorGroupLists from './errorGroupLists';
import errorGroups from './errorGroups';
import license from './license';
import location from './location';
import traces from './traces';
import transactionLists from './transactionLists';
import transactions from './transactions';
import urlParams from './urlParams';

const appReducer = combineReducers({
  appLists,
  apps,
  charts,
  distributions,
  errorGroupLists,
  errorGroups,
  license,
  location,
  traces,
  transactionLists,
  transactions,
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
