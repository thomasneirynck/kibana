import url from 'url';
import expect from 'expect.js';
import { getSavedObjectFactory } from '../get_saved_object';
import {
  search as mockSearch,
  visualization as mockVisualization,
  dashboard as mockDashboard
} from './__fixtures__/mock_saved_objects';

describe('saved_objects', function () {
  const mockGetSavedObject = () => {
    const mockKibanaServer = {
      config: () => {
        return {
          get: () => {}
        };
      },
      expose: () => {},
      info: {
        protocol: 'http'
      },
    };

    return getSavedObjectFactory(mockKibanaServer);
  };

  const mockRequest = (clientResponse) => {
    return {
      getUiSettingsService() {
        return {
          get() {
            return 'UTC';
          }
        };
      },
      getSavedObjectsClient() {
        return {
          get() {
            return clientResponse;
          }
        };
      }
    };
  };

  // test each of the saved object types
  const objectTypes = ['search', 'visualization', 'dashboard'];
  objectTypes.forEach(function (objectType) {
    describe(`type ${objectType}`, function () {
      let mockObject;
      let getSavedObject;
      let request;

      before(function () {
        switch(objectType) {
          case 'search':
            mockObject = mockSearch;
            break;
          case 'visualization':
            mockObject = mockVisualization;
            break;
          case 'dashboard':
            mockObject = mockDashboard;
        }
        request = mockRequest(mockObject);
        getSavedObject = mockGetSavedObject();
      });

      it('should contain specific props', async function () {
        const savedObject = await getSavedObject(request, objectType, mockObject._id, {});
        expect(savedObject).to.have.property('id', mockObject._id);
        expect(savedObject).to.have.property('type', mockObject._type);
        expect(savedObject).to.have.property('title');
        expect(savedObject).to.have.property('description');
        expect(savedObject).to.have.property('searchSource');
        expect(savedObject).to.have.property('url');

        expect(savedObject.searchSource).to.be.an(Object);
        expect(savedObject.url).to.be.a('string');
      });

      describe('url', function () {
        const timeParam = 'time:(from:now-1h,mode:quick,to:now)';
        const query = {
          _g: `(refreshInterval:(display:Off,pause:!f,value:0),${timeParam})`
        };

        it('should provide app url', async function () {
          const savedObject = await getSavedObject(request, objectType, mockObject._id, query);
          const params = url.parse(savedObject.url);
          expect(params).to.have.property('hash');
        });

        it('should remove the refreshInterval value', async function () {
          const savedObject = await getSavedObject(request, objectType, mockObject._id, query);
          const objectUrl = savedObject.url;
          expect(objectUrl).to.not.contain('refreshInterval');
        });

        it('should alwaus convert to absolute time', async function () {
          const savedObject = await getSavedObject(request, objectType, mockObject._id, query);
          const params = url.parse(savedObject.url);
          expect(params.hash).to.not.contain(query._g);
          expect(params.hash).to.match(/time\:.+mode\:absolute/);
          expect(params.hash).to.match(/time\:.+from\:/);
          expect(params.hash).to.match(/time\:.+to\:/);
        });
      });
    });
  });
});
