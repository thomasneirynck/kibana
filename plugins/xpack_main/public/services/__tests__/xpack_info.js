import expect from 'expect.js';
import ngMock from 'ng_mock';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import MockWindowProvider from './_mock_window';

const XPACK_INFO_KEY = 'xpackMain.info';

describe('xpack_info service', () => {
  let mockWindow;
  let xpackInfo;

  beforeEach(ngMock.module('kibana', ($provide) => {
    $provide.service('$window', MockWindowProvider);
  }));

  beforeEach(ngMock.inject(($window, Private) => {
    mockWindow = $window;
    xpackInfo = Private(XPackInfoProvider);
  }));

  it ('updates the stored xpack info', () => {
    const updatedXPackInfo = {
      foo: {
        bar: 17
      }
    };
    xpackInfo.set(updatedXPackInfo);
    expect(mockWindow.localStorage.getItem(XPACK_INFO_KEY)).to.be(JSON.stringify(updatedXPackInfo));
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
    expect(mockWindow.localStorage.getItem(XPACK_INFO_KEY)).to.be(undefined);
    expect(xpackInfo.get('foo.bar')).to.be(undefined);
  });

  it ('defaults to the provided default value if the requested path is not found', () => {
    xpackInfo.set({ foo: 'bar' });
    expect(xpackInfo.get('foo.baz', 17)).to.be(17);
  });
});
