import React from 'react';
import { Redirect } from 'react-router-dom';
import SetupInstructions from '../SetupInstructions';
import ServiceOverview from '../ServiceOverview';
import ErrorGroupDetails from '../ErrorGroupDetails';
import ErrorGroupOverview from '../ErrorGroupOverview';
import TransactionDetails from '../TransactionDetails';
import TransactionOverview from '../TransactionOverview';
import { legacyDecodeURIComponent } from '../../../utils/url';

export const routes = [
  {
    exact: true,
    path: '/',
    component: ServiceOverview,
    breadcrumb: 'APM'
  },
  {
    exact: true,
    path: '/:serviceName/errors/:groupId',
    component: ErrorGroupDetails,
    breadcrumb: ({ match }) => match.params.groupId
  },
  {
    exact: true,
    path: '/:serviceName/errors',
    component: ErrorGroupOverview,
    breadcrumb: 'Errors'
  },
  {
    switch: true,
    routes: [
      {
        exact: true,
        path: '/invalid-license',
        breadcrumb: 'Invalid License',
        render: () => <div>Invalid license</div>
      },
      {
        exact: true,
        path: '/setup-instructions',
        component: SetupInstructions,
        breadcrumb: 'Setup Instructions'
      },
      {
        exact: true,
        path: '/:serviceName',
        breadcrumb: ({ match }) => match.params.serviceName,
        render: ({ location }) => {
          return (
            <Redirect
              to={{
                ...location,
                pathname: `${location.pathname}/transactions`
              }}
            />
          );
        }
      }
    ]
  },
  {
    exact: true,
    path: '/:serviceName/transactions',
    component: TransactionOverview,
    breadcrumb: 'Transactions'
  },
  {
    exact: true,
    path: '/:serviceName/transactions/:transactionType',
    component: TransactionOverview,
    breadcrumb: ({ match }) =>
      legacyDecodeURIComponent(match.params.transactionType)
  },
  {
    exact: true,
    path: '/:serviceName/transactions/:transactionType/:transactionName',
    component: TransactionDetails,
    breadcrumb: ({ match }) =>
      legacyDecodeURIComponent(match.params.transactionName)
  }
];
