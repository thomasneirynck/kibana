import reducer from '../rootReducer';

describe('root reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({
      appLists: {},
      apps: {},
      charts: {},
      distributions: {},
      errorGroupLists: {},
      errorGroups: {},
      license: {},
      location: {},
      traces: {},
      transactionLists: {},
      transactions: {},
      urlParams: {}
    });
  });
});
