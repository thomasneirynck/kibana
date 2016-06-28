import expect from 'expect.js';
import ngMock from 'ng_mock';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';

const XPACK_INFO_KEY = 'xpackMain.info';

describe('xpack_info service', () => {
  let mockWindowService;
  let xpackInfo;

  beforeEach(ngMock.module('kibana', ($provide) => {
    $provide.service('$window', () => {
      let items = {};
      return {
        localStorage: {
          setItem(key, value) {
            items[key] = value;
          },
          getItem(key) {
            return items[key];
          },
          removeItem(key) {
            delete items[key];
          }
        }
      };
    });
  }));

  beforeEach(ngMock.inject(($window, Private) => {
    mockWindowService = $window;
    xpackInfo = Private(XPackInfoProvider);
  }));

  it ('updates the stored xpack info', () => {
    const updatedXPackInfo = {
      foo: {
        bar: 17
      }
    };
    xpackInfo.set(updatedXPackInfo);
    expect(mockWindowService.localStorage.getItem(XPACK_INFO_KEY)).to.be(JSON.stringify(updatedXPackInfo));
    expect(xpackInfo.get('foo.bar')).to.be(17);
  });

  it ('clears the stored xpack info', () => {
    const updatedXPackInfo = {
      foo: {
        bar: 17
      }
    };
    xpackInfo.set(updatedXPackInfo);
    expect(xpackInfo.get('foo.bar')).not.to.be(undefined);

    xpackInfo.clear();
    expect(mockWindowService.localStorage.getItem(XPACK_INFO_KEY)).to.be(undefined);
    expect(xpackInfo.get('foo.bar')).to.be(undefined);
  });

  it ('defaults to the provided default value if the requested path is not found', () => {
    xpackInfo.set({ foo: 'bar' });
    expect(xpackInfo.get('foo.baz', 17)).to.be(17);
  });
});
