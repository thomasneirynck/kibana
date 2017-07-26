import angular from 'angular';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import $ from 'jquery';
import findTestSubject from 'ui/jquery/find_test_subject';
import './fixtures/providers';

findTestSubject($);

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('monitoringKibanaSummary', function () {
  let $element;
  let scope;
  let compile;
  let isolatedScope;

  beforeEach(() => {
    ngMock.module('kibana');

    // compile and create scope
    ngMock.inject(($compile, $rootScope) => {
      const $scope = $rootScope.$new();
      $scope.kibana = {
        availability: true,
        status: 'green',
        transport_address: '192.168.1.100:5601',
        os_memory_free: '3984588',
        version: '42'
      };
      $element = angular.element(
        '<monitoring-kibana-summary kibana="kibana"></monitoring-kibana-summary>'
      );
      compile = $compile;
      scope = $scope;
    });
  });

  it('sets green status', () => {
    compile($element)(scope);
    $element.scope().$digest();
    isolatedScope = $element.isolateScope();

    expect($element.findTestSubject('transportAddress').html()).to.be('192.168.1.100:5601');
    expect($element.findTestSubject('osFreeMemory').html()).to.be('3984588'); // why isn't this formatted?
    expect($element.findTestSubject('version').html()).to.be('42');

    expect(isolatedScope.kibanaStatus).to.be('green');
  });

  it('offline status', () => {
    scope.kibana.availability = false;
    compile($element)(scope);
    $element.scope().$digest();
    isolatedScope = $element.isolateScope();

    expect(isolatedScope.kibanaStatus).to.be('offline');
  });
});
