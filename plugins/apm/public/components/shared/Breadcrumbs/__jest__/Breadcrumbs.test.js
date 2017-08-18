import { getBreadcrumbs } from '../index';

describe('Breadcrumbs', () => {
  it('getBreadcrumbs', () => {
    const match = {
      path: '/:appName/transactions/:transactionType/:transactionName',
      url: '/opbeans-backend/transactions/request/my-transaction-name',
      params: {
        appName: 'opbeans-backend',
        transactionType: 'request',
        transactionName: 'my-transaction-name'
      }
    };

    const routes = {
      '/': 'APM',
      '/:appName': params => params.appName,
      '/:appName/transactions/:transactionType': params =>
        params.transactionType,
      '/:appName/transactions/:transactionType/:transactionName': params =>
        params.transactionName
    };

    expect(getBreadcrumbs({ match, routes })).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend' },
      { label: 'request', url: '/opbeans-backend/transactions/request' },
      {
        label: 'my-transaction-name',
        url: '/opbeans-backend/transactions/request/my-transaction-name'
      }
    ]);
  });
});
