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
