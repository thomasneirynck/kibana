import expect from 'expect.js';
import sinon from 'sinon';
import validateConfig from '../../../server/lib/validate_config';

describe('Reporting: Validate config', function () {
  let config;
  const log = sinon.spy();

  beforeEach(() => {
    config = {
      get: sinon.stub(),
      set: sinon.stub()
    };
    log.reset();
  });

  it('should log a warning and set xpack.reporting.encryptionKey if not set', function () {
    expect(() => validateConfig(config, log)).not.to.throwError();

    sinon.assert.calledWith(config.set, 'xpack.reporting.encryptionKey');
    sinon.assert.calledWithMatch(log, /Generating a random key/);
    sinon.assert.calledWithMatch(log, /please set xpack.reporting.encryptionKey/);
  });
});
