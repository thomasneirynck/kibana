import expect from 'expect.js';
import { set } from 'lodash';
import setup from '../setup';

describe('setup()', () => {

  class MockErrorResponse extends Error {
    constructor(status) {
      super();
      this.status = status;
    }
  };

  let mockServer;
  let mockXPackMainPlugin;

  beforeEach(() => {
    mockServer = {
      plugins: {
        elasticsearch: {
          client: {
            transport: {
            }
          }
        }
      },
      log() {},
      expose(key, value) {
        set(this, [ 'pluginProperties', key ], value);
      },
      ext(e, handler) {
        set(this, [ 'eventHandlers', e ], handler);
      }
    };

    mockXPackMainPlugin = {
      status: {
        green(message) {
          this.message = message;
          this.state = 'green';
        },
        red(message) {
          this.message = message;
          this.state = 'red';
        }
      }
    };
  });

  describe('Elasticsearch APIs return successful responses', () => {

    beforeEach(() => {
      mockServer.plugins.elasticsearch.client.transport.request = () => {
        return new Promise((resolve) => {
          resolve('foobar');
        });
      };
    });

    it ('server should have an onPreResponse event handler registered', () => {
      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockServer.eventHandlers.onPreResponse).to.be.a(Function);
        mockServer.pluginProperties.info.stopPolling();
      });
    });

    it ('xpack_main plugin should expose the xpack info property', () => {
      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockServer.pluginProperties.info).to.be.an(Object);
        expect(mockServer.pluginProperties.info.isAvailable).to.be.a(Function);
        mockServer.pluginProperties.info.stopPolling();
      });
    });

    it ('xpack_main plugin should expose the xpack usage property', () => {
      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockServer.pluginProperties.usage).to.be('foobar');
        mockServer.pluginProperties.info.stopPolling();
      });
    });

    it ('xpack_main plugin status should be green', () => {
      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockXPackMainPlugin.status.state).to.be('green');
        expect(mockXPackMainPlugin.status.message).to.be('Ready');
        mockServer.pluginProperties.info.stopPolling();
      });
    });
  });

  describe('Elasticsearch APIs return a non-400 error response', () => {
    it ('xpack_main plugin status should be red', () => {
      mockServer.plugins.elasticsearch.client.transport.request = () => {
        return new Promise((resolve, reject) => {
          reject(new MockErrorResponse(500));
        });
      };

      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockXPackMainPlugin.status.state).to.be('red');
      });
    });
  });

  describe('Elasticsearch APIs return a 400 response', () => {
    it ('xpack_main plugin status should be red and x-pack not installed error message should be set', () => {
      mockServer.plugins.elasticsearch.client.transport.request = () => {
        return new Promise((resolve, reject) => {
          reject(new MockErrorResponse(400));
        });
      };

      return setup(mockServer, mockXPackMainPlugin)
      .then(() => {
        expect(mockXPackMainPlugin.status.state).to.be('red');
        expect(mockXPackMainPlugin.status.message).to.be('x-pack plugin is not installed on Elasticsearch cluster');
      });
    });
  });

});
