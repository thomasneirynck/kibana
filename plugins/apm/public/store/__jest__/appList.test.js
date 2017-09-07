import { loadAppList, APP_LIST_LOADING, APP_LIST_SUCCESS } from '../appLists';
import { getKey } from '../apiHelpers';
import fetchMock from 'fetch-mock';
import response from './apps-response.json';

describe('loadAppList', () => {
  const key = getKey({ start: 'myStart', end: 'myEnd' });
  const dispatch = jest.fn();
  const matcherName = /\/api\/apm\/apps/;

  beforeEach(() => {
    fetchMock.get(matcherName, response);
    return loadAppList({
      start: 'myStart',
      end: 'myEnd'
    })(dispatch);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should make a http request', () => {
    expect(fetchMock.lastUrl(matcherName)).toContain(
      '../api/apm/apps?start=myStart&end=myEnd'
    );
  });

  it('should dispatch APP_LIST_LOADING', () => {
    expect(dispatch).toHaveBeenCalledWith({
      type: APP_LIST_LOADING,
      key
    });
  });

  it('should dispatch APP_LIST_SUCCESS with http response', () => {
    expect(dispatch).toHaveBeenCalledWith({
      response,
      type: APP_LIST_SUCCESS,
      key
    });
  });
});
