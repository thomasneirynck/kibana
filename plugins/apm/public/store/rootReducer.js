import { combineReducers } from 'redux';

import detailsCharts from './detailsCharts';
import errorDistribution from './errorDistribution';
import errorGroup from './errorGroup';
import errorGroupList from './errorGroupList';
import license from './license';
import location from './location';
import overviewCharts from './overviewCharts';
import service from './service';
import serviceList from './serviceList';
import sorting from './sorting';
import spans from './spans';
import transaction from './transaction';
import transactionDistribution from './transactionDistribution';
import transactionList from './transactionList';
import urlParams from './urlParams';

const rootReducer = combineReducers({
  detailsCharts,
  errorDistribution,
  errorGroup,
  errorGroupList,
  license,
  location,
  overviewCharts,
  service,
  serviceList,
  sorting,
  spans,
  transaction,
  transactionDistribution,
  transactionList,
  urlParams
});

export default rootReducer;
