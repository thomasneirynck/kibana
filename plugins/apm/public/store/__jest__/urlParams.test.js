import reducer, { updateTimePicker } from '../urlParams';
import { updateLocation } from '../location';

describe('urlParams', () => {
  it('should handle LOCATION_UPDATE for transactions section', () => {
    const state = reducer(
      {},
      updateLocation({
        pathname:
          'myAppName/transactions/myTransactionType/myTransactionName/b/c',
        search: '?transactionId=myTransactionId&detailTab=request&traceId=10'
      })
    );

    expect(state).toEqual({
      appName: 'myAppName',
      traceId: 10,
      transactionId: 'myTransactionId',
      transactionName: 'myTransactionName',
      detailTab: 'request',
      transactionType: 'myTransactionType'
    });
  });

  it('should handle LOCATION_UPDATE for error section', () => {
    const state = reducer(
      {},
      updateLocation({
        pathname: 'myAppName/errors/myErrorGroupId',
        search: '?detailTab=request&transactionId=myTransactionId'
      })
    );

    expect(state).toEqual(
      expect.objectContaining({
        appName: 'myAppName',
        errorGroupId: 'myErrorGroupId',
        detailTab: 'request',
        transactionId: 'myTransactionId'
      })
    );
  });

  it('should handle TIMEPICKER_UPDATE', () => {
    const state = reducer(
      {},
      updateTimePicker({
        min: 'minTime',
        max: 'maxTime'
      })
    );

    expect(state).toEqual({ end: 'maxTime', start: 'minTime' });
  });
});
