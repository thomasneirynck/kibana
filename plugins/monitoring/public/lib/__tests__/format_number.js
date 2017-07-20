import moment from 'moment';
import expect from 'expect.js';
import { formatNumber, formatTimestampToDuration } from '../format_number';
import { CALCULATE_DURATION_SINCE, CALCULATE_DURATION_UNTIL } from 'monitoring-constants';

const getArbitraryTime = () => {
  return moment(1500513816007);
};

/**
 * Test the moment-duration-format template
 */
describe('formatTimestampToDuration', () => {
  describe('format timestamp to duration - time since', () => {
    it('should format timstamp to human-readable duration', () => {
      // time inputs are a few "moments" extra from the time advertised by name
      const fiftynineSecondsAgo = getArbitraryTime().subtract(59, 'seconds');
      const fiveMinsAgo = getArbitraryTime().subtract(5, 'minutes').subtract(30, 'seconds');
      const sixHoursAgo = getArbitraryTime().subtract(6, 'hours').subtract(30, 'minutes');
      const sevenDaysAgo = getArbitraryTime().subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
      const eightWeeksAgo = getArbitraryTime().subtract(8, 'weeks').subtract(7, 'days').subtract(6, 'hours').subtract(18, 'minutes');
      expect(formatTimestampToDuration(fiftynineSecondsAgo, CALCULATE_DURATION_SINCE, getArbitraryTime())).to.be('59 seconds');
      expect(formatTimestampToDuration(fiveMinsAgo, CALCULATE_DURATION_SINCE, getArbitraryTime())).to.be('5 min');
      expect(formatTimestampToDuration(sixHoursAgo, CALCULATE_DURATION_SINCE, getArbitraryTime())).to.be('6 hrs 30 min');
      expect(formatTimestampToDuration(sevenDaysAgo, CALCULATE_DURATION_SINCE, getArbitraryTime())).to.be('7 days 6 hrs 18 min');
      expect(formatTimestampToDuration(eightWeeksAgo, CALCULATE_DURATION_SINCE, getArbitraryTime())).to.be('2 months 2 days');
    });
  });

  describe('format timestamp to duration - time until', () => {
    it('should format timstamp to human-readable duration', () => {
      // time inputs are a few "moments" extra from the time advertised by name
      const fiftynineSecondsFromNow = getArbitraryTime().add(59, 'seconds');
      const fiveMinsFromNow = getArbitraryTime().add(10, 'minutes');
      const sixHoursFromNow = getArbitraryTime().add(6, 'hours').add(30, 'minutes');
      const sevenDaysFromNow = getArbitraryTime().add(7, 'days').add(6, 'hours').add(18, 'minutes');
      const eightWeeksFromNow = getArbitraryTime().add(8, 'weeks').add(7, 'days').add(6, 'hours').add(18, 'minutes');
      expect(formatTimestampToDuration(fiftynineSecondsFromNow, CALCULATE_DURATION_UNTIL, getArbitraryTime())).to.be('59 seconds');
      expect(formatTimestampToDuration(fiveMinsFromNow, CALCULATE_DURATION_UNTIL, getArbitraryTime())).to.be('10 min');
      expect(formatTimestampToDuration(sixHoursFromNow, CALCULATE_DURATION_UNTIL, getArbitraryTime())).to.be('6 hrs 30 min');
      expect(formatTimestampToDuration(sevenDaysFromNow, CALCULATE_DURATION_UNTIL, getArbitraryTime())).to.be('7 days 6 hrs 18 min');
      expect(formatTimestampToDuration(eightWeeksFromNow, CALCULATE_DURATION_UNTIL, getArbitraryTime())).to.be('2 months 2 days');
    });
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
