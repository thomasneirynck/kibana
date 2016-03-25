import expect from 'expect.js';
import normalizeVersionString from '../normalize_version_string';

describe('Normalizing Version String', () => {
  it('Returns version string when valid', () => {
    const result = normalizeVersionString('1.2.30');
    expect(result).to.be('1.2.30');
  });
  it('Strips -SNAPSHOT from a valid string', () => {
    const result = normalizeVersionString('1.2.30-SNAPSHOT');
    expect(result).to.be('1.2.30');
  });
  it('Returns empty string when invalid', () => {
    const result = normalizeVersionString('foo-SNAPSHOT');
    expect(result).to.be('');
  });
});
