import reducer, { TIMEPICKER_UPDATE } from '../urlParams';
import { LOCATION_UPDATE } from '../location';

describe('urlParams', () => {
  it('should handle LOCATION_UPDATE', () => {
    const state = reducer(
      {},
      {
        type: LOCATION_UPDATE,
        location: {
          pathname: 'myAppName/myTransactionType/myTransactionName/b/c',
          search: '?transactionId=25&transactionTab=request&traceId=10'
        }
      }
    );

    expect(state).toEqual({
      appName: 'myAppName',
      traceId: 10,
      transactionId: '25',
      transactionName: 'myTransactionName',
      transactionTab: 'request',
      transactionType: 'myTransactionType'
    });
  });

  it('should handle TIMEPICKER_UPDATE', () => {
    const state = reducer(
      {},
      {
        type: TIMEPICKER_UPDATE,
        time: {
          min: 'minTime',
          max: 'maxTime'
        }
      }
    );

    expect(state).toEqual({ end: 'maxTime', start: 'minTime' });
  });
});
