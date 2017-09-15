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
      errorGroupSorting: {
        descending: true,
        key: 'latestOccurrenceAt'
      },
      license: {},
      location: {},
      traces: {},
      transactionDistributions: {},
      transactionLists: {},
      transactions: {},
      transactionSorting: {
        descending: true,
        key: 'impact'
      },
      urlParams: {}
    });
  });
});
