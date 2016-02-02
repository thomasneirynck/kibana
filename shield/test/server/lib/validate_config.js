const expect = require('chai').expect;
const sinon = require('sinon');
const validateConfig = require('requirefrom')('server/lib')('validate_config');

function getValidateConfigStub(configValues) {
  const config = {get: () => {}};
  sinon.stub(config, 'get', (key) => configValues[key]);
  return () => validateConfig(config);
}

describe('Validate config', function () {
  it('should throw an error if shield.encryptionKey is not set', function () {
    const validateWithoutEncryptionKey = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar'
    });

    expect(validateWithoutEncryptionKey).to.throw(/shield.encryptionKey is required/);
  });

  it('should throw an error if SSL is not being used', function () {
    const validateWithoutSsl = getValidateConfigStub({
      'shield.encryptionKey': 'baz'
    });

    expect(validateWithoutSsl).to.throw(/HTTPS is required/);
  });

  it('should not throw an error if SSL is not being used and the config option to skip the check is set', function () {
    const validateWithNoSslSkipCheck = getValidateConfigStub({
      'shield.encryptionKey': 'baz',
      'shield.skipSslCheck': true
    });

    expect(validateWithNoSslSkipCheck).not.to.throw();
  });

  it('should not throw any errors with a valid config', function () {
    const validateWithValidConfig = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar',
      'shield.encryptionKey': 'baz'
    });

    expect(validateWithValidConfig).not.to.throw();
  });
});
