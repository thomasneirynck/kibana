import angular from 'angular';
import expect from 'expect.js';
import ngMock from 'ng_mock';
import $ from 'jquery';
import findTestSubject from 'ui/jquery/find_test_subject';
import './fixtures/providers';

findTestSubject($);

describe('monitoringClusterStatusElasticsearch', function () {
  let $element;
  let compile;
  let scope;

  beforeEach(() => {
    ngMock.module('kibana');

    // compile and create scope
    ngMock.inject(($compile, $rootScope) => {
      const $scope = $rootScope.$new();
      $scope.cluster = {
        version: '0.10'
      };
      $scope.pageData = {
        clusterStatus: {
          status: 'green',
          nodesCount: 2,
          indicesCount: 6,
          memUsed: 2339,
          memMax: 2339 * 4,
          totalShards: 28,
          unassignedShards: 2,
          documentCount: 35793,
          dataSize: 35793,
          upTime: 3573984759347593
        }
      };
      $element = angular.element(
        '<monitoring-cluster-status-elasticsearch></monitoring-cluster-status-elasticsearch>'
      );
      compile = $compile;
      scope = $scope;
    });
  });

  it('loading spinner', () => {
    scope.cluster = undefined;
    compile($element)(scope);
    $element.scope().$digest();
    expect($element.find('.fa.fa-spinner')).to.have.length(1);
  });

  it('sets green status', () => {
    compile($element)(scope);
    $element.scope().$digest();

    expect($element.find('.status.status-green')).to.have.length(1);

    expect($element.findTestSubject('nodesCount').html()).to.be('2');
    expect($element.findTestSubject('indicesCount').html()).to.be('6');
    expect($element.findTestSubject('memory').html()).to.be('2KB / 9KB');
    expect($element.findTestSubject('totalShards').html()).to.be('28');
    expect($element.findTestSubject('unassignedShards').html()).to.be('2');
    expect($element.findTestSubject('documentCount').html()).to.be('35,793');
    expect($element.findTestSubject('dataSize').html()).to.be('35KB');
    expect($element.findTestSubject('uptime').html()).to.be('113255 years');
    expect($element.findTestSubject('version').html()).to.be('0.10');

    expect($element.scope().statusIconClass).to.be('fa fa-check');
  });
});
