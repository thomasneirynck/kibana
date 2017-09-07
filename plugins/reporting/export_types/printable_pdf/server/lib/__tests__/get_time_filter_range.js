import expect from 'expect.js';
import { getTimeFilterRange } from '../get_time_filter_range';

describe('getTimeFilterRange', () => {
  const query = {
    _g: `(time:(from:'2016-07-09T13:15:00.000Z',mode:absolute,to:'2016-07-19T13:14:00.000Z'))`
  };

  it (`gets 'from' property`, () => {
    const timeRange = getTimeFilterRange('UTC', query);
    expect(timeRange.to).to.be.a('string');
  });

  it (`gets 'to' property`, () => {
    const timeRange = getTimeFilterRange('America/New York', query);
    expect(timeRange.to).to.be.a('string');
  });

  it ('Converts to UTC time zone', () => {
    const timeRange = getTimeFilterRange('UTC', query);
    expect(timeRange.from).to.be('Sat, Jul 9, 2016 1:15 PM');
    expect(timeRange.to).to.be('Tue, Jul 19, 2016 1:14 PM');
  });

  it ('Converts to America/New_York time zone', () => {
    const timeRange = getTimeFilterRange('America/New_York', query);
    expect(timeRange.from).to.be('Sat, Jul 9, 2016 9:15 AM');
    expect(timeRange.to).to.be('Tue, Jul 19, 2016 9:14 AM');
  });

  it ('Converts to UTC time zone if time zone is unknown', () => {
    const timeRange = getTimeFilterRange('blahblahblah', query);
    expect(timeRange.from).to.be('Sat, Jul 9, 2016 1:15 PM');
    expect(timeRange.to).to.be('Tue, Jul 19, 2016 1:14 PM');
  });

  it ('Converts to UTC time zone if time zone is undefined', () => {
    const timeRange = getTimeFilterRange(undefined, query);
    expect(timeRange.from).to.be('Sat, Jul 9, 2016 1:15 PM');
    expect(timeRange.to).to.be('Tue, Jul 19, 2016 1:14 PM');
  });

  it ('Converts to UTC time zone if time zone is null', () => {
    const timeRange = getTimeFilterRange(null, query);
    expect(timeRange.from).to.be('Sat, Jul 9, 2016 1:15 PM');
    expect(timeRange.to).to.be('Tue, Jul 19, 2016 1:14 PM');
  });
});
