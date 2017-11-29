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

describe('ML - <ml-select-interval>', function () {
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
      $compile('<ml-select-interval />')($scope);
    }).to.not.throwError('Not initialized.');

    expect($scope.setInterval).to.be.a('function');
    expect($scope.interval).to.eql({ display: 'Auto', val: 'auto' });
    expect($scope.intervalOptions).to.eql([
      { display: 'Auto', val: 'auto' },
      { display: '1 hour', val: 'hour' },
      { display: '1 day', val: 'day' },
      { display: 'Show all', val: 'second' }
    ]);
  });

});
