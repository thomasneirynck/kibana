import angular from 'angular';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import $ from 'jquery';
import './fixtures/providers';
require('ui/jquery/find_test_subject')($);

describe('monitoringClusterStatusKibana', function () {
  let $element;
  let compile;
  let scope;

  beforeEach(() => {
    ngMock.module('kibana');

    // compile and create scope
    ngMock.inject(($compile, $rootScope) => {
      const $scope = $rootScope.$new();
      $scope.cluster = true;
      $scope.pageData = {
        clusterStatus: {
          status: 'green',
          count: 2,
          requests_total: 6,
          concurrent_connections: 1,
          response_time_max: 12000,
          memory_size: 23424,
          memory_limit: 23424 * 4
        }
      };
      $element = angular.element(
        '<monitoring-cluster-status-kibana></monitoring-cluster-status-kibana>'
      );
      compile = $compile;
      scope = $scope;
    });
  });

  it('loading spinner', () => {
    // unsets a totally unrelated object tells the UI that the pageData is ready
    scope.cluster = undefined;
    compile($element)(scope);
    $element.scope().$digest();
    expect($element.find('.fa.fa-spinner')).to.have.length(1);
  });

  it('sets green status', () => {
    compile($element)(scope);
    $element.scope().$digest();

    expect($element.find('.status.status-green')).to.have.length(1);

    expect($element.findTestSubject('count').html()).to.be('2');
    expect($element.findTestSubject('requests_total').html()).to.be('6');
    expect($element.findTestSubject('concurrent_connections').html()).to.be('1');
    expect($element.findTestSubject('response_time_max').html()).to.be('12000 ms');
    expect($element.findTestSubject('memory_usage').html()).to.be('25.00%');

    expect($element.scope().statusIconClass).to.be('fa fa-check');
  });
});
