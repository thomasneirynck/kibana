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

describe('ML - <ml-select-limit>', () => {
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

  it('Initialization doesn\'t throw an error', () => {
    expect(function () {
      $compile('<ml-select-limit />')($scope);
    }).to.not.throwError('Not initialized.');

    expect($scope.setLimit).to.be.a('function');
    expect($scope.limit).to.eql({ display: '10', val: 10 });
    expect($scope.limitOptions).to.eql([
      { display: '5', val: 5 },
      { display: '10', val: 10 },
      { display: '25', val: 25 },
      { display: '50', val: 50 }
    ]);
  });

});
