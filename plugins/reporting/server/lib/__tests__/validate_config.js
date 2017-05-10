import expect from 'expect.js';
import sinon from 'sinon';
import { validateConfig } from '../validate_config';

describe('Reporting: Validate config', function () {
  const log = sinon.spy();

  beforeEach(() => {
    log.reset();
  });

  [undefined, null].forEach(value => {
    it(`should log a warning and set xpack.reporting.encryptionKey if encryptionKey is ${value}`, function () {
      const config = {
        get: sinon.stub().returns(value),
        set: sinon.stub()
      };

      expect(() => validateConfig(config, log)).not.to.throwError();

      sinon.assert.calledWith(config.set, 'xpack.reporting.encryptionKey');
      sinon.assert.calledWithMatch(log, /Generating a random key/);
      sinon.assert.calledWithMatch(log, /please set xpack.reporting.encryptionKey/);
    });
  });
});
