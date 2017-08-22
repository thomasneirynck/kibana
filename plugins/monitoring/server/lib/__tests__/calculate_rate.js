import { calculateRate } from '../calculate_rate';
import expect from 'expect.js';

describe('Calculate Rate', () => {
  it('returns null when all fields are undefined', () => {
    const result = calculateRate({});
    expect(result).to.be(null);
  });

  it('returns null when time window size is 0', () => {
    const result = calculateRate({
      hitTimestamp: '2017-08-08T18:33:04.501Z',
      earliestHitTimestamp: '2017-08-08T17:33:04.501Z',
      latestTotal: 24924,
      earliestTotal: 18945,
      timeWindowMin: '2017-08-08T17:33:04.501Z',
      timeWindowMax: '2017-08-08T17:33:04.501Z' // max === min
    });
    expect(result).to.be(null);
  });

  it('returns null when time between latest hit and earliest hit 0', () => {
    const result = calculateRate({
      hitTimestamp: '2017-08-08T18:33:04.501Z',
      earliestHitTimestamp: '2017-08-08T18:33:04.501Z', // latest === earliest
      latestTotal: 24924,
      earliestTotal: 18945,
      timeWindowMin: '2017-08-08T17:33:04.501Z',
      timeWindowMax: '2017-08-08T18:33:04.501Z'
    });
    expect(result).to.be(null);
  });

  it('calculates a rate over time', () => {
    const result = calculateRate({
      hitTimestamp: '2017-08-08T18:33:04.501Z',
      earliestHitTimestamp: '2017-08-08T17:33:04.501Z',
      latestTotal: 24924,
      earliestTotal: 18945,
      timeWindowMin: '2017-08-08T17:33:04.501Z',
      timeWindowMax: '2017-08-08T18:33:04.501Z'
    });
    expect(result).to.be(1.6608333333333334);
  });
});
