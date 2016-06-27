import expect from 'expect.js';
import ngMock from 'ng_mock';

describe('xpack_info services', () => {
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

  describe('xpackInfo service', () => {
    let xpackInfoService;

    beforeEach(ngMock.inject(($window, xpackInfo) => {
      xpackInfoService = xpackInfo;
    }));

    it ('updates the stored xpack info', () => {
      const updatedXPackInfo = {
        foo: {
          bar: 17
        }
      };
      xpackInfoService.set(updatedXPackInfo);
      expect(xpackInfoService.get('foo.bar')).to.be(17);
    });

    it ('clears the stored xpack info', () => {
      const updatedXPackInfo = {
        foo: {
          bar: 17
        }
      };
      xpackInfoService.set(updatedXPackInfo);
      expect(xpackInfoService.get('foo.bar')).not.to.be(undefined);

      xpackInfoService.clear();
      expect(xpackInfoService.get('foo.bar')).to.be(undefined);
    });

    it ('defaults to the provided default value if the requested path is not found', () => {
      xpackInfoService.set({ foo: 'bar' });
      expect(xpackInfoService.get('foo.baz', 17)).to.be(17);
    });
  });

  describe('xpackInfoSignature service', () => {
    let xpackInfoSignatureService;

    beforeEach(ngMock.inject(($window, xpackInfoSignature) => {
      xpackInfoSignatureService = xpackInfoSignature;
    }));

    it ('updates the stored xpack info signature', () => {
      const updatedXPackInfoSignature = 'foobar';
      xpackInfoSignatureService.set(updatedXPackInfoSignature);
      expect(xpackInfoSignatureService.get()).to.be(updatedXPackInfoSignature);
    });

    it ('clears the stored xpack info signature', () => {
      const updatedXPackInfoSignature = 'foobar';
      xpackInfoSignatureService.set(updatedXPackInfoSignature);
      expect(xpackInfoSignatureService.get()).not.to.be(undefined);

      xpackInfoSignatureService.clear();
      expect(xpackInfoSignatureService.get()).to.be(undefined);
    });
  });
});
