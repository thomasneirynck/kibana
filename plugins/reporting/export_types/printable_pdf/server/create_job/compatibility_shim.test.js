import { once } from 'lodash';
import { compatibilityShimFactory } from './compatibility_shim';

const createMockServer = () => {
  return {
    expose: jest.fn(), //fool once_per_server
    log: jest.fn()
  };
};

const createMockRequest = () => {
  return {
    getSavedObjectsClient: once(function () {
      return {
        get: jest.fn()
      };
    })
  };
};

test(`passes title through if provided`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());
  const title = 'test title';

  const createJobMock = jest.fn();
  await compatibilityShim(createJobMock)({ title, relativeUrl: '/something' }, null, createMockRequest());

  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][0].title).toBe(title);
});


test(`gets the title from the savedObject`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const createJobMock = jest.fn();
  const mockRequest = createMockRequest();
  const title = 'savedTitle';
  mockRequest.getSavedObjectsClient().get.mockReturnValue({
    attributes: {
      title
    }
  });

  await compatibilityShim(createJobMock)({ objectType: 'search', savedObjectId: 'abc', relativeUrl: '/something' }, null, mockRequest);

  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][0].title).toBe(title);
});

test(`passes the objectType and savedObjectId to the savedObjectsClient`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const createJobMock = jest.fn();
  const mockRequest = createMockRequest();
  mockRequest.getSavedObjectsClient().get.mockReturnValue({
    attributes: {
      title: ''
    }
  });

  const objectType = 'search';
  const savedObjectId = 'abc';
  await compatibilityShim(createJobMock)({ objectType, savedObjectId, }, null, mockRequest);

  const getMock = mockRequest.getSavedObjectsClient().get.mock;
  expect(getMock.calls.length).toBe(1);
  expect(getMock.calls[0][0]).toBe(objectType);
  expect(getMock.calls[0][1]).toBe(savedObjectId);
});

test(`logs deprecation when retrieiving the title from the savedObject`, async () => {
  const mockServer = createMockServer();
  const compatibilityShim = compatibilityShimFactory(mockServer);

  const createJobMock = jest.fn();
  const mockRequest = createMockRequest();
  mockRequest.getSavedObjectsClient().get.mockReturnValue({
    attributes: {
      title: ''
    }
  });

  await compatibilityShim(createJobMock)({ objectType: 'search', savedObjectId: 'abc', relativeUrl: '/something' }, null, mockRequest);

  expect(mockServer.log.mock.calls.length).toBe(1);
  expect(mockServer.log.mock.calls[0][0]).toEqual(['warning', 'reporting', 'deprecation']);
});

test(`passes objectType through`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const createJobMock = jest.fn();
  const mockRequest = createMockRequest();

  const objectType = 'foo';
  await compatibilityShim(createJobMock)({ title: 'test', relativeUrl: '/something', objectType }, null, mockRequest);

  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][0].objectType).toBe(objectType);
});

test(`passes the relativeUrl through`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const createJobMock = jest.fn();

  const relativeUrl = '/app/kibana#something';
  await compatibilityShim(createJobMock)({ title: 'test', relativeUrl }, null, null);
  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][0].relativeUrl).toBe(relativeUrl);
});

const testSavedObjectRelativeUrl = (objectType, expectedUrl) => {
  test(`generates the saved object relativeUrl for ${objectType}`, async () => {
    const compatibilityShim = compatibilityShimFactory(createMockServer());
    const createJobMock = jest.fn();

    await compatibilityShim(createJobMock)({ title: 'test', objectType, savedObjectId: 'abc', }, null, null);
    expect(createJobMock.mock.calls.length).toBe(1);
    expect(createJobMock.mock.calls[0][0].relativeUrl).toBe(expectedUrl);
  });
};

testSavedObjectRelativeUrl('search', '/app/kibana#/discover/abc?');
testSavedObjectRelativeUrl('visualization', '/app/kibana#/visualize/edit/abc?');
testSavedObjectRelativeUrl('dashboard', '/app/kibana#/dashboard/abc?');

test(`appends the queryString to the relativeUrl when generating from the savedObject`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());
  const createJobMock = jest.fn();

  await compatibilityShim(createJobMock)({ title: 'test', objectType: 'search', savedObjectId: 'abc', queryString: 'foo=bar' }, null, null);
  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][0].relativeUrl).toBe('/app/kibana#/discover/abc?foo=bar');
});

test(`passes headers and request through`, async () => {
  const compatibilityShim = compatibilityShimFactory(createMockServer());

  const createJobMock = jest.fn();

  const headers = {};
  const request = createMockRequest();

  await compatibilityShim(createJobMock)({ title: 'test', relativeUrl: '/something' }, headers, request);

  expect(createJobMock.mock.calls.length).toBe(1);
  expect(createJobMock.mock.calls[0][1]).toBe(headers);
  expect(createJobMock.mock.calls[0][2]).toBe(request);
});
