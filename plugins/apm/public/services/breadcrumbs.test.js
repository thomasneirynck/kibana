import { setupRoutes } from './breadcrumbs';
import { legacyDecodeURIComponent } from '../utils/url';

const routes = {
  '/': 'APM',
  '/setup-instructions': 'Setup Instructions',
  '/:serviceName': {
    url: params => `/${params.serviceName}/transactions`,
    label: params => params.serviceName
  },
  '/:serviceName/errors': 'Errors',
  '/:serviceName/errors/:groupId': params => params.groupId,
  '/:serviceName/transactions': {
    skip: true
  },
  '/:serviceName/transactions/:transactionType': params =>
    params.transactionType,
  '/:serviceName/transactions/:transactionType/:transactionName': params =>
    legacyDecodeURIComponent(params.transactionName)
};

describe('breadcrumbs', () => {
  it('/:serviceName', () => {
    expect(setupRoutes(routes)('/opbeans-backend')).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' }
    ]);
  });

  it('/setup-instructions', () => {
    expect(setupRoutes(routes)('/setup-instructions')).toEqual([
      { label: 'APM', url: '/' },
      { label: 'Setup Instructions', url: '/setup-instructions' }
    ]);
  });

  it('/:serviceName/errors', () => {
    expect(setupRoutes(routes)('/opbeans-backend/errors')).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'Errors', url: '/opbeans-backend/errors' }
    ]);
  });

  it('/:serviceName/errors/:groupId', () => {
    expect(
      setupRoutes(routes)(
        '/opbeans-backend/errors/a43bcaa33f1577ca6b5d99f05faa4e07'
      )
    ).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'Errors', url: '/opbeans-backend/errors' },
      {
        label: 'a43bcaa33f1577ca6b5d99f05faa4e07',
        url: '/opbeans-backend/errors/a43bcaa33f1577ca6b5d99f05faa4e07'
      }
    ]);
  });

  it('/:serviceName/transactions', () => {
    expect(setupRoutes(routes)('/opbeans-backend/transactions')).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' }
    ]);
  });

  it('/:serviceName/transactions/:transactionType', () => {
    expect(
      setupRoutes(routes)('/opbeans-backend/transactions/request')
    ).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'request', url: '/opbeans-backend/transactions/request' }
    ]);
  });

  it('/:serviceName/transactions/:transactionType/:transactionName', () => {
    expect(
      setupRoutes(routes)(
        '/opbeans-backend/transactions/request/GET ~2Fapi~2Fstats'
      )
    ).toEqual([
      { label: 'APM', url: '/' },
      { label: 'opbeans-backend', url: '/opbeans-backend/transactions' },
      { label: 'request', url: '/opbeans-backend/transactions/request' },
      {
        label: 'GET /api/stats',
        url: '/opbeans-backend/transactions/request/GET ~2Fapi~2Fstats'
      }
    ]);
  });
});
