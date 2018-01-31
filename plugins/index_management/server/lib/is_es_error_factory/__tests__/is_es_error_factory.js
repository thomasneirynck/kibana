import expect from 'expect.js';
import { isEsErrorFactory } from '../is_es_error_factory';
import { set } from 'lodash';

class MockAbstractEsError {}

describe('is_es_error_factory', () => {

  let mockServer;
  let isEsError;

  beforeEach(() => {
    const mockEsErrors = {
      _Abstract: MockAbstractEsError
    };
    mockServer = {};
    set(mockServer, 'plugins.elasticsearch.getCluster', () => ({ errors: mockEsErrors }));

    isEsError = isEsErrorFactory(mockServer);
  });

  describe('#isEsErrorFactory', () => {

    it('should return a function', () => {
      expect(isEsError).to.be.a(Function);
    });

    describe('returned function', () => {

      it('should return true if passed-in err is a known esError', () => {
        const knownEsError = new MockAbstractEsError();
        expect(isEsError(knownEsError)).to.be(true);
      });

      it('should return false if passed-in err is not a known esError', () => {
        const unknownEsError = {};
        expect(isEsError(unknownEsError)).to.be(false);

      });
    });
  });
});
