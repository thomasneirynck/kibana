import reducer from '../rootReducer';

describe('root reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      appLists: {},
      apps: {},
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
        app: {
          key: 'appName',
          descending: false
        }
      },
      traces: {},
      transactionDistributions: {},
      transactionLists: {},
      transactions: {},
      urlParams: {}
    });
  });
});
