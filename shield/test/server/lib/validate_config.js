import {expect} from 'chai';
import sinon from 'sinon';
import validateConfig from '../../../server/lib/validate_config';

function getValidateConfigStub(configValues, logFn) {
  const config = {get: () => {}};
  sinon.stub(config, 'get', (key) => configValues[key]);
  return () => validateConfig(config, logFn);
}

describe('Validate config', function () {
  let logSpy;
  beforeEach(() => {
    logSpy = sinon.spy();
  });

  it('should throw an error if shield.encryptionKey is not set', function () {
    const validateWithoutEncryptionKey = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar'
    }, logSpy);

    expect(validateWithoutEncryptionKey).to.throw(/shield.encryptionKey is required/);
    sinon.assert.notCalled(logSpy);
  });

  it('should throw an error if SSL is not being used', function () {
    const validateWithoutSsl = getValidateConfigStub({
      'shield.encryptionKey': 'baz'
    }, logSpy);

    expect(validateWithoutSsl).to.throw(/HTTPS is required/);
    sinon.assert.notCalled(logSpy);
  });

  it('should not throw an error if SSL is not being used and the config option to skip the check is set', function () {
    const validateWithNoSslSkipCheck = getValidateConfigStub({
      'shield.encryptionKey': 'baz',
      'shield.skipSslCheck': true
    }, logSpy);

    expect(validateWithNoSslSkipCheck).not.to.throw();
    sinon.assert.calledWithMatch(logSpy, /SSL is still required/);
  });

  it('should not throw any errors with a valid config', function () {
    const validateWithValidConfig = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar',
      'shield.encryptionKey': 'baz'
    }, logSpy);

    expect(validateWithValidConfig).not.to.throw();
    sinon.assert.notCalled(logSpy);
  });
});
