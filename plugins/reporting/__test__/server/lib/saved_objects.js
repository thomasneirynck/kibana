const url = require('url');
const Bluebird = require('bluebird');
const expect = require('expect.js');
const savedObjects = require('../../../server/lib/saved_objects');
const mockSavedObjects = require('../../fixtures/mock_saved_objects');

describe('saved_objects', function () {
  let mockClient;
  let clientResponse;
  let module;

  function setClientResponse(obj) {
    clientResponse = Bluebird.resolve(obj);
  }

  beforeEach(function () {
    mockClient = {
      get: () => Bluebird.resolve(clientResponse)
    };

    module = savedObjects(mockClient, {
      kibanaApp: '/app/kibana',
      kibanaIndex: '.kibana',
    });
  });

  // test each of the saved object types
  const objectTypes = ['search', 'visualization', 'dashboard'];
  objectTypes.forEach(function (objectType) {
    describe(`type ${objectType}`, function () {
      let mockObject;
      let savedObject;

      beforeEach(function () {
        mockObject = mockSavedObjects[objectType];
        setClientResponse(mockObject);

        return module.get(objectType, mockObject._id)
        .then(function (obj) {
          savedObject = obj;
        });
      });

      it('should contain specific props', function () {
        expect(savedObject).to.have.property('id', mockObject._id);
        expect(savedObject).to.have.property('type', mockObject._type);
        expect(savedObject).to.have.property('title');
        expect(savedObject).to.have.property('description');
        expect(savedObject).to.have.property('searchSource');
        expect(savedObject).to.have.property('getUrl');

        expect(savedObject.searchSource).to.be.an(Object);
        expect(savedObject.getUrl).to.be.a(Function);
      });

      describe('getUrl', function () {
        let timeParam;
        let query;

        beforeEach(() => {
          timeParam = 'time:(from:now-1h,mode:quick,to:now)';
          query = {
            _g: `(refreshInterval:(display:Off,pause:!f,value:0),${timeParam})`
          };
        });

        it('should provide app url', function () {
          const params = url.parse(savedObject.getUrl());
          expect(params).to.have.property('hash');
        });

        it('should remove the refreshInterval value', function () {
          var objectUrl = savedObject.getUrl(query);
          expect(objectUrl).to.not.contain('refreshInterval');
        });

        describe('absolute time', function () {
          it('should use absolute time by default', function () {
            var params = url.parse(savedObject.getUrl(query));
            expect(params.hash).to.not.contain(query._g);
            expect(params.hash).to.match(/time\:.+mode\:absolute/);
            expect(params.hash).to.match(/time\:.+from\:/);
            expect(params.hash).to.match(/time\:.+to\:/);
          });
        });

        describe('relative time', function () {
          let urlOptions;

          beforeEach(() => {
            urlOptions = {
              useAbsoluteTime: false
            };
          });

          it('should append relative time to hash', function () {
            var params = url.parse(savedObject.getUrl(query, urlOptions));
            expect(params.hash).to.contain(`_g=(${timeParam})`);
          });
        });
      });

      describe('toJSON', function () {
        it('should serialize the object', function () {
          const obj = savedObject.toJSON();

          expect(obj).to.have.property('id', mockObject._id);
          expect(obj).to.have.property('type', mockObject._type);
          expect(obj).to.have.property('title', savedObject.title);
          expect(obj).to.have.property('description', savedObject.description);
          expect(obj).to.have.property('searchSource');
          expect(obj).to.have.property('url');
        });

        it('should take query params and append to hash', function () {
          const query = {
            _g: '(time:(from:now-1h,mode:quick,to:now))'
          };

          const obj = savedObject.toJSON(query, { useAbsoluteTime: false });
          const params = url.parse(obj.url);
          expect(params.hash).to.contain(query._g);
        });
      });

    });
  });
});