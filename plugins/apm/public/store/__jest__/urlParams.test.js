import reducer, { updateTimePicker } from '../urlParams';
import { updateLocation } from '../location';

describe('urlParams', () => {
  it('should handle LOCATION_UPDATE for transactions section', () => {
    const state = reducer(
      {},
      updateLocation({
        pathname:
          'myAppName/transactions/myTransactionType/myTransactionName/b/c',
        search: '?transactionId=25&detailTab=request&traceId=10'
      })
    );

    expect(state).toEqual({
      appName: 'myAppName',
      traceId: 10,
      transactionId: '25',
      transactionName: 'myTransactionName',
      detailTab: 'request',
      transactionType: 'myTransactionType'
    });
  });

  it('should handle LOCATION_UPDATE for error section', () => {
    const state = reducer(
      {},
      updateLocation({
        pathname: 'myAppName/errors/myErrorGroupingId',
        search: '?detailTab=request&bucket=4'
      })
    );

    expect(state).toEqual(
      expect.objectContaining({
        appName: 'myAppName',
        errorGroupingId: 'myErrorGroupingId',
        detailTab: 'request',
        bucket: 4
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
