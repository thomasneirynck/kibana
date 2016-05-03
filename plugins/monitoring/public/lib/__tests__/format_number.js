import formatNumber from '../format_number';
import expect from 'expect.js';

describe('format_number', () => {
  it('should format time since', () => {
    expect(formatNumber(3000, 'time_since')).to.be('a few seconds');
    expect(formatNumber(300000, 'time_since')).to.be('5 minutes');
  });

  it('should format time in H:mm:ss', () => {
    expect(formatNumber(1461868937000, 'time')).to.match(/\d\d:\d\d:\d\d/);
  });

  it('should format integers with commas', () => {
    expect(formatNumber(3000), 'int_commas').to.be('3,000.0');
  });

  it('should format bytes', () => {
    expect(formatNumber(800000, 'byte')).to.be('781.3KB');
  });

  it('should format ms', () => {
    expect(formatNumber(3000, 'ms')).to.be('3,000.0ms');
  });

});
