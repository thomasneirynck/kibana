import expect from 'expect.js';
import processVersionString from '../process_version_string';

describe('Processing Version String', () => {
  it('Returns version string when valid', () => {
    const result = processVersionString('1.2.30');
    expect(result).to.be('1.2.30');
  });
  it('Strips -SNAPSHOT from a valid string', () => {
    const result = processVersionString('1.2.30-SNAPSHOT');
    expect(result).to.be('1.2.30');
  });
  it('Returns empty string when invalid', () => {
    const result = processVersionString('foo-SNAPSHOT');
    expect(result).to.be('');
  });
});
