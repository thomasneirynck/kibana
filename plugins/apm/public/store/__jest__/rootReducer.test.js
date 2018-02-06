import reducer from '../rootReducer';

describe('root reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      serviceLists: {},
      services: {},
      charts: {},
      errorDistributions: {},
      errorGroupLists: {},
      errorGroups: {},
      license: {
        data: {
          isActive: false
        }
      },
      location: {
        pathname: '',
        search: '',
        hash: ''
      },
      sorting: {
        transaction: {
          key: 'impact',
          descending: true
        },
        service: {
          key: 'serviceName',
          descending: false
        }
      },
      spans: {},
      transactionDistributions: {},
      transactionLists: {},
      transactions: {},
      urlParams: {}
    });
  });
});
