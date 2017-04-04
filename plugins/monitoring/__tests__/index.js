import { noop } from 'lodash';
import expect from 'expect.js';
import monitoringPlugin from '../index';
import sinon from 'sinon';

describe('monitoring', function () {
  describe('deprecations', function () {
    let transformDeprecations;

    before(function () {
      const Plugin = function (options) {
        this.deprecations = options.deprecations;
      };

      const plugin = monitoringPlugin({ Plugin });

      const noopDeprecation = () => noop;
      const deprecations = plugin.deprecations({ rename: noopDeprecation });
      transformDeprecations = (settings, log = noop) => {
        deprecations.forEach(deprecation => deprecation(settings, log));
      };
    });

    it('verificationMode is set to full when elasticsearch.ssl.verify is true', function () {
      const settings = {
        elasticsearch: {
          ssl: {
            verify: true
          }
        }
      };

      transformDeprecations(settings);
      expect(settings.elasticsearch.ssl.verificationMode).to.eql('full');
    });

    it(`sets verificationMode to none when verify is false`, function () {
      const settings = {
        elasticsearch: {
          ssl: {
            verify: false
          }
        }
      };

      transformDeprecations(settings);
      expect(settings.elasticsearch.ssl.verificationMode).to.be('none');
      expect(settings.elasticsearch.ssl.verify).to.be(undefined);
    });

    it('should log when deprecating verify from false', function () {
      const settings = {
        elasticsearch: {
          ssl: {
            verify: false
          }
        }
      };

      const log = sinon.spy();
      transformDeprecations(settings, log);
      expect(log.calledOnce).to.be(true);
    });

    it('sets verificationMode to full when verify is true', function () {
      const settings = {
        elasticsearch: {
          ssl: {
            verify: true
          }
        }
      };

      transformDeprecations(settings);
      expect(settings.elasticsearch.ssl.verificationMode).to.be('full');
      expect(settings.elasticsearch.ssl.verify).to.be(undefined);
    });

    it('should log when deprecating verify from true', function () {
      const settings = {
        elasticsearch: {
          ssl: {
            verify: true
          }
        }
      };

      const log = sinon.spy();
      transformDeprecations(settings, log);
      expect(log.calledOnce).to.be(true);
    });

    it(`shouldn't set verificationMode when verify isn't present`, function () {
      const settings = {
        elasticsearch: {
          ssl: {}
        }
      };

      transformDeprecations(settings);
      expect(settings.elasticsearch.ssl.verificationMode).to.be(undefined);
    });

    it(`shouldn't log when verify isn't present`, function () {
      const settings = {
        elasticsearch: {
          ssl: {}
        }
      };

      const log = sinon.spy();
      transformDeprecations(settings, log);
      expect(log.called).to.be(false);
    });
  });
});
