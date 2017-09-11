import { getBreadcrumbs, _routes as routes } from '../view';

describe('Breadcrumbs', () => {
  it('should return breadcrumps for transaction section', () => {
    const match = {
      path: '/:appName/transactions/:transactionType/:transactionName',
      url: '/opbeans-backend/transactions/request/my-transaction-name',
      params: {
        appName: 'opbeans-backend',
        transactionType: 'request',
        transactionName: 'my-transaction-name'
      }
    };

    expect(getBreadcrumbs({ match, routes })).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'request', url: '/opbeans-backend/transactions/request' },
      {
        label: 'my-transaction-name',
        url: '/opbeans-backend/transactions/request/my-transaction-name'
      }
    ]);
  });

  it('should return breadcrumps for error section', () => {
    const match = {
      path: '/:appName/errors/:groupId',
      url: '/opbeans-backend/errors/my-group-id',
      params: {
        appName: 'opbeans-backend',
        groupId: 'my-group-id'
      }
    };

    expect(getBreadcrumbs({ match, routes })).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'Errors', url: '/opbeans-backend/errors' },
      {
        label: 'my-group-id',
        url: '/opbeans-backend/errors/my-group-id'
      }
    ]);
  });
});
