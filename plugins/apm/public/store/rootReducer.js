import { combineReducers } from 'redux';

import appLists from './appLists';
import apps from './apps';
import distributions from './distributions';
import location from './location';
import traces from './traces';
import transactions from './transactions';
import transactionLists from './transactionLists';
import urlParams from './urlParams';

const appReducer = combineReducers({
  appLists,
  apps,
  distributions,
  location,
  traces,
  transactions,
  transactionLists,
  urlParams
});

// This adds support for clearing the redux store, eg. via an interval, to avoid stale data.
const rootReducer = (state, action) => {
  let newState = { ...state };
  if (action.type === 'RESET_STATE') {
    newState = {
      ...state,
      transactionLists: undefined,
      app: undefined,
      apps: undefined
    };
  }

  return appReducer(newState, action);
};

export default rootReducer;
