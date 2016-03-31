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

  it('should throw an error if xpack.security.encryptionKey is not set', function () {
    const validateWithoutEncryptionKey = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar'
    }, logSpy);

    expect(validateWithoutEncryptionKey).to.throw(/xpack.security.encryptionKey is required/);
    sinon.assert.notCalled(logSpy);
  });

  it('should throw an error if SSL is not being used', function () {
    const validateWithoutSsl = getValidateConfigStub({
      'xpack.security.encryptionKey': 'baz'
    }, logSpy);

    expect(validateWithoutSsl).to.throw(/HTTPS is required/);
    sinon.assert.notCalled(logSpy);
  });

  it('should not throw without SSL when configured to skip check', function () {
    const validateWithNoSslSkipCheck = getValidateConfigStub({
      'xpack.security.encryptionKey': 'baz',
      'xpack.security.skipSslCheck': true
    }, logSpy);

    expect(validateWithNoSslSkipCheck).not.to.throw();
    sinon.assert.calledWithMatch(logSpy, /skipping.+ssl\ check/i);
    sinon.assert.calledWithMatch(logSpy, /ssl\ is\ required/i);
  });

  it('should not throw without SSL when configured to skip check and use insecure sessions', function () {
    const validateWithNoSslSkipCheck = getValidateConfigStub({
      'xpack.security.encryptionKey': 'baz',
      'xpack.security.skipSslCheck': true,
      'xpack.security.useUnsafeSessions': true
    }, logSpy);

    expect(validateWithNoSslSkipCheck).not.to.throw();
    sinon.assert.calledWithMatch(logSpy, /skipping.+ssl\ check/i);
    sinon.assert.calledWithMatch(logSpy, /insecure\ session/i);
    sinon.assert.calledWithMatch(logSpy, /not\ recommended/i);
  });

  it('should not throw any errors with a valid config', function () {
    const validateWithValidConfig = getValidateConfigStub({
      'server.ssl.key': 'foo',
      'server.ssl.cert': 'bar',
      'xpack.security.encryptionKey': 'baz'
    }, logSpy);

    expect(validateWithValidConfig).not.to.throw();
    sinon.assert.notCalled(logSpy);
  });
});
