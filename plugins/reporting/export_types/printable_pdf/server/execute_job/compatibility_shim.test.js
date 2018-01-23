import { compatibilityShimFactory } from './compatibility_shim';

const createMockServer = () => {
  const config = {
    'server.host': 'localhost',
    'server.port': '5601',
    'server.basePath': '',
  };

  return {
    info: {
      protocol: 'http'
    },
    expose: jest.fn(), // fools once_per_server
    log: jest.fn(),
    config: () => {
      return {
        get: key => config[key]
      };
    }
  };
};

test(`it throw error if full URL is provided that is not a Kibana URL`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  await expect(compatibilityShim(mockCreateJob)({ query: '', objects: [ { url: 'https://localhost/app/kibana' } ] })).rejects.toBeDefined();
});

test(`it passes url through if it is a Kibana URL`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const url = 'http://localhost:5601/app/kibana/#visualize';
  await compatibilityShim(mockCreateJob)({ objects: [ { url } ] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].objects[0].url).toBe(url);
});

test(`it generates the absolute url if a urlHash is provided`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const urlHash = '#visualize';
  await compatibilityShim(mockCreateJob)({ objects: [ { urlHash } ] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].urls[0]).toBe('http://localhost:5601/app/kibana#visualize');
});

test(`it generates the absolute url if a relativeUrl is provided`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const relativeUrl = '/app/kibana#/visualize?';
  await compatibilityShim(mockCreateJob)({ objects: [ { relativeUrl } ] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].urls[0]).toBe('http://localhost:5601/app/kibana#/visualize?');
});

test(`it generates the absolute url if a relativeUrl with querystring is provided`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const relativeUrl = '/app/kibana?_t=123456789#/visualize?_g=()';
  await compatibilityShim(mockCreateJob)({ objects: [ { relativeUrl } ] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].urls[0]).toBe('http://localhost:5601/app/kibana?_t=123456789#/visualize?_g=()');
});

test(`it passes the provided timeRange through`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const timeRange = {};
  await compatibilityShim(mockCreateJob)({ timeRange, objects: [] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].timeRange).toEqual(timeRange);
});

test(`it passes the provided timeRange through`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const timeRange = {};
  await compatibilityShim(mockCreateJob)({ timeRange, objects: [] });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].timeRange).toEqual(timeRange);
});

test(`it calculates the timeRange using the query`, async () => {
  const mockCreateJob = jest.fn();
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const query = {
    _g: `(time:(from:'1999-01-01T00:00:00.000Z',mode:absolute,to:'2000-01-01T00:00:00.000Z'))`
  };
  await compatibilityShim(mockCreateJob)({ query, objects: [], browserTimezone: 'America/New_York' });
  expect(mockCreateJob.mock.calls.length).toBe(1);
  expect(mockCreateJob.mock.calls[0][0].timeRange).toEqual({
    from: 'Thu, Dec 31, 1998 7:00 PM',
    to: 'Fri, Dec 31, 1999 7:00 PM'
  });
});