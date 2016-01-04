var url = require('url');
var Promise = require('bluebird');
var sinon = require('sinon');
var expect = require('chai').expect;
var lib = require('requirefrom')('server/lib');
var fixtures = require('requirefrom')('test/fixtures');
var savedObjects = lib('saved_objects');
var mockSavedObjects = fixtures('mock_saved_objects');
var mockServerConfig = fixtures('mock_server_config');

describe('saved_objects', function () {
  var mockConfig;
  var mockClient;
  var clientResponse;
  var module;

  function setClientResponse(obj) {
    clientResponse = Promise.resolve(obj);
  }

  beforeEach(function () {
    mockConfig = mockServerConfig.create();

    mockClient = {
      get: () => Promise.resolve(clientResponse)
    };

    module = savedObjects(mockClient, mockConfig);
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

        return module[objectType](mockObject._id)
        .then(function (obj) {
          savedObject = obj;
        });
      });

      it('should contain specific props', function () {
        expect(savedObject).to.have.property('id', mockObject._id);
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
            _g: 'time:(from:now-1h,mode:quick,to:now))'
          };
          var str = url.format({ query });
          var params = url.parse(savedObject.getUrl(query));
          expect(params.hash).to.contain(str);
        });
      });
    });
  });
});