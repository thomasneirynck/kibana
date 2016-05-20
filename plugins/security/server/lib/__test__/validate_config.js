import expect from 'expect.js';
import sinon from 'sinon';
import validateConfig from '../validate_config';

describe('Validate config', function () {
  let config;
  const log = sinon.spy();

  beforeEach(() => {
    config = {
      get: sinon.stub(),
      set: sinon.stub()
    };
    log.reset();
  });

  it('should log a warning and set xpack.security.encryptionKey if not set', function () {
    config.get.withArgs('server.ssl.key').returns('foo');
    config.get.withArgs('server.ssl.cert').returns('bar');

    expect(() => validateConfig(config, log)).not.to.throwError();

    sinon.assert.calledWith(config.set, 'xpack.security.encryptionKey');
    sinon.assert.calledWithMatch(log, /Generating a random key/);
    sinon.assert.calledWithMatch(log, /please set xpack.security.encryptionKey/);
  });

  it('should throw an error if SSL is not being used', function () {
    config.get.withArgs('xpack.security.encryptionKey').returns('baz');
    console.log(config.get('server.ssl.key'));

    expect(() => validateConfig(config, log)).to.throwError(/HTTPS is required/);

    sinon.assert.notCalled(config.set);
    sinon.assert.notCalled(log);
  });

  it('should not throw without SSL when configured to skip check', function () {
    config.get.withArgs('xpack.security.encryptionKey').returns('baz');
    config.get.withArgs('xpack.security.skipSslCheck').returns(true);

    expect(() => validateConfig(config, log)).not.to.throwError();

    sinon.assert.notCalled(config.set);
    sinon.assert.calledWithMatch(log, /skipping.+ssl\ check/i);
    sinon.assert.calledWithMatch(log, /ssl\ is\ required/i);
  });

  it('should not throw without SSL when configured to skip check and use insecure sessions', function () {
    config.get.withArgs('xpack.security.encryptionKey').returns('baz');
    config.get.withArgs('xpack.security.skipSslCheck').returns(true);
    config.get.withArgs('xpack.security.useUnsafeSessions').returns(true);

    expect(() => validateConfig(config, log)).not.to.throwError();

    sinon.assert.notCalled(config.set);
    sinon.assert.calledWithMatch(log, /skipping.+ssl\ check/i);
    sinon.assert.calledWithMatch(log, /insecure\ session/i);
    sinon.assert.calledWithMatch(log, /not\ recommended/i);
  });

  it('should not throw any errors with a valid config', function () {
    config.get.withArgs('server.ssl.key').returns('foo');
    config.get.withArgs('server.ssl.cert').returns('bar');
    config.get.withArgs('xpack.security.encryptionKey').returns('baz');

    expect(() => validateConfig(config, log)).not.to.throwError();

    sinon.assert.notCalled(config.set);
    sinon.assert.notCalled(log);
  });
});
