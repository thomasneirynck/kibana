import { memoize } from 'lodash';
import { getAbsoluteUrlFactory } from './get_absolute_url';

const createMockServer = ({ settings = {} } = {}) => {
  const mockServer = {
    expose: () => {},
    config: memoize(() => {
      return {
        get: jest.fn()
      };
    }),
    info: {
      protocol: 'http'
    }
  };

  const defaultSettings = {
    'server.host': 'something',
    'server.port': 8080,
    'server.basePath': '/tst',
    'xpack.reporting.kibanaApp': '/app/kibana',
    'xpack.reporting.kibanaServer': {}
  };
  mockServer.config().get.mockImplementation(key => {
    return key in settings ? settings[key] : defaultSettings[key];
  });

  return mockServer;
};

test(`by default it builds url using information from server.info.protocol and the server.config`, () => {
  const mockServer = createMockServer();

  const getAbsoluteUrl = getAbsoluteUrlFactory(mockServer);
  const urlHash = '/relative/path?querystring';
  const absoluteUrl = getAbsoluteUrl(urlHash);
  expect(absoluteUrl).toBe(`http://something:8080/tst/app/kibana#${urlHash}`);
});

test(`uses kibanaServer.protocol if specified`, () => {
  const settings = {
    'xpack.reporting.kibanaServer.protocol': 'https'
  };
  const mockServer = createMockServer({ settings });

  const getAbsoluteUrl = getAbsoluteUrlFactory(mockServer);
  const urlHash = '/relative/path?querystring';
  const absoluteUrl = getAbsoluteUrl(urlHash);
  expect(absoluteUrl).toBe(`https://something:8080/tst/app/kibana#${urlHash}`);
});

test(`uses kibanaServer.hostname if specified`, () => {
  const settings = {
    'xpack.reporting.kibanaServer.hostname': 'something-else'
  };
  const mockServer = createMockServer({ settings });

  const getAbsoluteUrl = getAbsoluteUrlFactory(mockServer);
  const urlHash = '/relative/path?querystring';
  const absoluteUrl = getAbsoluteUrl(urlHash);
  expect(absoluteUrl).toBe(`http://something-else:8080/tst/app/kibana#${urlHash}`);
});

test(`uses kibanaServer.port if specified`, () => {
  const settings = {
    'xpack.reporting.kibanaServer.port': 8008
  };
  const mockServer = createMockServer({ settings });

  const getAbsoluteUrl = getAbsoluteUrlFactory(mockServer);
  const urlHash = '/relative/path?querystring';
  const absoluteUrl = getAbsoluteUrl(urlHash);
  expect(absoluteUrl).toBe(`http://something:8008/tst/app/kibana#${urlHash}`);
});

test(`works without a urlHash`, () => {
  const mockServer = createMockServer();

  const getAbsoluteUrl = getAbsoluteUrlFactory(mockServer);
  const absoluteUrl = getAbsoluteUrl();
  expect(absoluteUrl).toBe(`http://something:8080/tst/app/kibana`);
});
