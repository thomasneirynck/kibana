import expect from 'expect.js';
import { getTimeFilterRange } from '../get_time_filter_range';

describe('getTimeFilterRange', () => {
  const query = {
    _g: `(time:(from:'2016-07-09T13:15:00.000Z',mode:absolute,to:'2016-07-19T13:14:00.000Z'))`
  };

  it (`gets 'from' property`, () => {
    const timeRange = getTimeFilterRange(query);
    expect(timeRange.to).to.be.a('string');
  });

  it (`gets 'to' property`, () => {
    const timeRange = getTimeFilterRange(query);
    expect(timeRange.to).to.be.a('string');
  });
});
