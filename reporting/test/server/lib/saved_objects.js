var url = require('url');
var Promise = require('bluebird');
var sinon = require('sinon');
var expect = require('chai').expect;
var lib = require('requirefrom')('server/lib');
var fixtures = require('requirefrom')('test/fixtures');
var savedObjects = lib('saved_objects');
var mockSavedObjects = fixtures('mock_saved_objects');

describe('saved_objects', function () {
  var mockConfig;
  var mockClient;
  var clientResponse;
  var module;

  function setClientResponse(obj) {
    clientResponse = Promise.resolve(obj);
  }

  beforeEach(function () {
    mockClient = {
      get: () => Promise.resolve(clientResponse)
    };

    module = savedObjects(mockClient, {
      kibanaApp: '/app/kibana',
      kibanaIndex: '.kibana',
    });
  });

  // test each of the saved object types
  var objectTypes = ['search', 'visualization', 'dashboard'];
  objectTypes.forEach(function (objectType) {
    describe(`type ${objectType}`, function () {
      var mockObject;
      var savedObject;

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
        expect(savedObject).to.have.property('description');
        expect(savedObject).to.have.property('searchSource');
        expect(savedObject).to.have.property('getUrl');

        expect(savedObject.searchSource).to.be.instanceof(Object);
        expect(savedObject.getUrl).to.be.instanceof(Function);
      });

      describe('getUrl', function () {
        it('should provide app url', function () {
          var params = url.parse(savedObject.getUrl());
          expect(params).to.have.property('hash');
        });

        it('should take query params and append to hash', function () {
          var query = {
            _g: '(time:(from:now-1h,mode:quick,to:now))'
          };
          var params = url.parse(savedObject.getUrl(query));
          expect(params.hash).to.contain(query._g);
        });

        it('should remove the refreshInterval value', function () {
          var query = {
            _g: '(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-15m,mode:quick,to:now))'
          };

          var url = savedObject.getUrl(query);
          expect(url).to.contain('time:(from:now-15m,mode:quick,to:now))');
          expect(url).to.not.contain('refreshInterval');
        });
      });
    });
  });
});