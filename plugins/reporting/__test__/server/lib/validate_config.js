import expect from 'expect.js';
import sinon from 'sinon';
import validateConfig from '../../../server/lib/validate_config';

describe('validateConfig', () => {
  const mockConfig = {};

  it('should throw an error if xpack.reporting.encryptionKey is not set', () => {
    mockConfig.get = sinon.stub();
    mockConfig.get.withArgs('xpack.reporting.encryptionKey').returns(undefined);

    const validateConfigFn = () => validateConfig(mockConfig);
    expect(validateConfigFn).to.throwException(/xpack.reporting.encryptionKey is required in kibana.yml/);
  });
});
