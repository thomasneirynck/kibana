import React from 'react';
import { Provider } from 'react-redux';
import { Router, Route, Redirect } from 'react-router-dom';
import createHistory from 'history/createHashHistory';

import AppList from './components/app/AppList/container';
import TransactionsOverview from './components/app/TransactionsOverview/container';
import TransactionDetails from './components/app/TransactionDetails/container';
import AppSettings from './components/app/AppSettings';
import ErrorGroupList from './components/app/ErrorGroupList/container';
import ErrorGroupDetails from './components/app/ErrorGroupDetails/container';
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
          {/* App */}
          <Route exact path="/" component={AppList} />
          <Route exact path="/:appName/settings" component={AppSettings} />

          {/* Errors */}
          <Route
            path="/:appName/errors/:groupingId"
            component={ErrorGroupDetails}
          />
          <Route exact path="/:appName/errors" component={ErrorGroupList} />

          {/* Transactions */}
          <Route
            exact
            path="/:appName"
            render={({ location, match }) => {
              const appName = match.params.appName;
              const newPath = `/${appName}/transactions${location.search}`;
              return <Redirect to={newPath} />;
            }}
          />
          <Route
            exact
            path="/:appName/transactions"
            component={TransactionsOverview}
          />

          <Route
            exact
            path="/:appName/transactions/:transactionType"
            component={TransactionsOverview}
          />
          <Route
            path="/:appName/transactions/:transactionType/:transactionName"
            component={TransactionDetails}
          />
        </Main>
      </Router>
    </Provider>
  );
}

export default Root;
