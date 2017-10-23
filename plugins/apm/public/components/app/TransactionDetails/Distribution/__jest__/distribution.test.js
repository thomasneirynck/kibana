import { getFormattedBuckets } from '../view';

describe('Distribution', () => {
  it('getFormattedBuckets', () => {
    const buckets = [
      { key: 0, count: 0 },
      { key: 20, count: 0 },
      { key: 40, count: 0 },
      { key: 60, count: 5, transactionId: 'someTransactionId' },
      {
        key: 80,
        count: 100,
        transactionId: 'anotherTransactionId'
      }
    ];
    expect(getFormattedBuckets(buckets, 20)).toEqual([
      { x: 20, x0: 0, y: 0 },
      { x: 40, x0: 20, y: 0 },
      { x: 60, x0: 40, y: 0 },
      { transactionId: 'someTransactionId', x: 80, x0: 60, y: 10 },
      { transactionId: 'anotherTransactionId', x: 100, x0: 80, y: 100 }
    ]);
  });
});
