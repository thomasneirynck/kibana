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
      license: {},
      location: {},
      sorting: {
        transaction: {
          key: 'impact',
          descending: true
        },
        errorGroup: {
          key: 'latestOccurrenceAt',
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
