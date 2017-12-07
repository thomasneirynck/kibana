import expect from 'expect.js';
import { formatNumber } from '../format_number';

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
