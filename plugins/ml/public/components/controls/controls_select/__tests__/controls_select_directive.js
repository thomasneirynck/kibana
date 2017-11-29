/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import ngMock from 'ng_mock';
import expect from 'expect.js';

describe('ML - <ml-controls-select>', function () {
  let $scope;
  let $compile;
  let $element;

  beforeEach(ngMock.module('kibana'));
  beforeEach(() => {
    ngMock.inject(function ($injector) {
      $compile = $injector.get('$compile');
      const $rootScope = $injector.get('$rootScope');
      $scope = $rootScope.$new();
    });
  });

  afterEach(() => {
    $scope.$destroy();
  });

  it('Plain initialization doesn\'t throw an error', function () {
    $element = $compile('<ml-controls-select />')($scope);
    const scope = $element.isolateScope();

    expect(scope.identifier).to.be.an('undefined');
    expect(scope.label).to.be.an('undefined');
    expect(scope.options).to.be.an('undefined');
    expect(scope.selected).to.be.an('undefined');
    expect(scope.setOption).to.be.a('function');
    expect(scope.showIcons).to.be.an('undefined');
    expect(scope.updateFn).to.be.a('undefined');
  });

  it('Initialize with attributes, call pass-through function', function (done) {
    $scope.intervalOptions = [
      { display: 'testOptionLabel1', val: 'testOptionValue1' },
      { display: 'testOptionLabel2', val: 'testOptionValue2' }
    ];
    $scope.selectedOption = $scope.intervalOptions[1];

    $scope.testUpdateFn = function () {
      done();
    };

    $element = $compile(`
      <ml-controls-select
        identifier="testIdentifier"
        label="testLabel"
        options="intervalOptions"
        selected="selectedOption"
        show-icons="false"
        update-fn="testUpdateFn"
      />
    `)($scope);

    const scope = $element.isolateScope();

    expect(scope.identifier).to.be('testIdentifier');
    expect(scope.label).to.be('testLabel');
    expect(scope.options).to.equal($scope.intervalOptions);
    expect(scope.selected).to.equal($scope.selectedOption);
    expect(scope.setOption).to.be.a('function');
    expect(scope.showIcons).to.be.false;
    expect(scope.updateFn).to.be.a('function');

    // this should call the function passed through ($scope.testUpdateFn)
    // which in return calls done() to finish the test
    scope.setOption();
  });

});
