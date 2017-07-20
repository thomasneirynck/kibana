import moment from 'moment';
import expect from 'expect.js';
import { formatNumber, formatTimestampToDuration } from '../format_number';
import { CALCULATE_DURATION_SINCE, CALCULATE_DURATION_UNTIL } from 'monitoring-constants';

/**
 * Test the moment-duration-format template
 */
describe('format timestamp to duration - time since', () => {
  it('should format timstamp to human-readable duration', () => {
    // time inputs are a few "moments" extra from the time advertised by name
    const fiveMinsAgo = moment().subtract(5, 'minutes').subtract(30, 'seconds');
    const sixHoursAgo = moment().subtract(6, 'hours').subtract(30, 'minutes');
    const sevenDaysAgo = moment().subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
    const eightWeeksAgo = moment().subtract(8, 'weeks').subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
    expect(formatTimestampToDuration(fiveMinsAgo, CALCULATE_DURATION_SINCE)).to.be('5 min');
    expect(formatTimestampToDuration(sixHoursAgo, CALCULATE_DURATION_SINCE)).to.be('6 hrs 30 min');
    expect(formatTimestampToDuration(sevenDaysAgo, CALCULATE_DURATION_SINCE)).to.be('7 days 6 hrs 18 min');
    expect(formatTimestampToDuration(eightWeeksAgo, CALCULATE_DURATION_SINCE)).to.be('2 months 2 days');
  });
});

describe('format timestamp to duration - time until', () => {
  it('should format timstamp to human-readable duration', () => {
    // time inputs are a few "moments" extra from the time advertised by name
    const fiveMinsAgo = moment().subtract(5, 'minutes').subtract(30, 'seconds');
    expect(formatTimestampToDuration(fiveMinsAgo, CALCULATE_DURATION_UNTIL)).to.be('5 min');
  });
});

describe('format_number', () => {
  it('should format time since', () => {
    expect(formatNumber(3000, 'time_since')).to.be('a few seconds');
    expect(formatNumber(300000, 'time_since')).to.be('5 minutes');
  });

  it('should format time in H:mm:ss', () => {
    expect(formatNumber(1461868937000, 'time')).to.match(/\d\d:\d\d:\d\d/);
  });

  it('should format integers with commas', () => {
    expect(formatNumber(3000, 'int_commas')).to.be('3,000');
    expect(formatNumber(4321.1)).to.be('4,321.1');
  });

  it('should format bytes', () => {
    expect(formatNumber(800000, 'byte')).to.be('781.3KB');
  });

  it('should format ms', () => {
    expect(formatNumber(3000, 'ms')).to.be('3,000.0ms');
  });

  it('should not format strings', () => {
    expect(formatNumber('N/A', 'ms')).to.be('N/A');
  });

  it('should not format undefined', () => {
    expect(formatNumber(undefined, 'ms')).to.be('0ms');
  });

  it('should format NaN as 0', () => {
    expect(formatNumber(Number.NaN, 'ms')).to.be('0ms');
  });

});
