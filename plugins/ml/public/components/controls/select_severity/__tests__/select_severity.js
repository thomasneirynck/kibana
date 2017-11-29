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

describe('ML - <ml-select-severity>', function () {
  let $scope;
  let $compile;

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

  it('Initialization doesn\'t throw an error', function () {
    expect(function () {
      $compile('<ml-select-severity />')($scope);
    }).to.not.throwError('Not initialized.');

    expect($scope.setThreshold).to.be.a('function');
    expect($scope.threshold).to.eql({ display: 'warning', val: 0 });
    expect($scope.thresholdOptions).to.eql([
      { display: 'critical', val: 75 },
      { display: 'major', val: 50 },
      { display: 'minor', val: 25 },
      { display: 'warning', val: 0 }
    ]);
  });

});
