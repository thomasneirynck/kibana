import angular from 'angular';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import $ from 'jquery';
import findTestSubject from 'ui/jquery/find_test_subject';
import 'plugins/monitoring/directives/__tests__/fixtures/providers';

findTestSubject($);

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('monitoringClusterStatusLogstash', function () {
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
          count: 2,
          events_in_total: 6,
          events_out_total: 6,
          avg_memory: 200,
          avg_memory_used: 23,
          max_uptime: 5600,
          avg_cpu_usage: 14
        }
      };
      $element = angular.element(
        '<monitoring-cluster-status-logstash></monitoring-cluster-status-logstash>'
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

    expect($element.findTestSubject('count').html()).to.be('2');
    expect($element.findTestSubject('events_in_total').html()).to.be('6');
    expect($element.findTestSubject('events_out_total').html()).to.be('6');
    expect($element.findTestSubject('avg_memory').html()).to.be('200');
    expect($element.findTestSubject('avg_memory_used').html()).to.be('200');
    expect($element.findTestSubject('avg_cpu_usage').html()).to.be('14%');
  });
});
