import React from 'react';
import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';
import createHistory from 'history/createHashHistory';

import AppList from './components/app/AppList/container';
import TransactionsOverview from './components/app/TransactionsOverview/container';
import TransactionDetails from './components/app/TransactionDetails/container';
import AppSettings from './components/app/AppSettings';
import Main from './components/app/Main/container';

import configureStore from './store/config/configureStore';
import connectTimeFilterToStore from './utils/timepicker/connectToStore';
import connectHistoryToStore from './utils/connectHistoryToStore';

const store = configureStore();
const history = createHistory();

function Root({ timefilter }) {
  connectTimeFilterToStore(timefilter, store.dispatch);
  connectHistoryToStore(history, store.dispatch);

  return (
    <Provider store={store}>
      <Router history={history}>
        <Main>
          <Route exact path="/" component={AppList} />

          <Switch>
            <Route exact path="/:appName/settings" component={AppSettings} />

            <Route exact path="/:appName" component={TransactionsOverview} />
            <Route
              exact
              path="/:appName/:transactionType"
              component={TransactionsOverview}
            />
          </Switch>

          <Route
            path="/:appName/:transactionType/:transactionName"
            component={TransactionDetails}
          />
        </Main>
      </Router>
    </Provider>
  );
}

export default Root;
