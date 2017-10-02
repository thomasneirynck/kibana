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

describe('ML - <ml-explorer-chart>', function () {
  let $scope;
  let $compile;

  beforeEach(() => {
    ngMock.module('kibana');
    ngMock.inject(function (_$compile_, $rootScope) {
      $compile = _$compile_;
      $scope = $rootScope.$new();
    });
  });

  afterEach(function () {
    $scope.$destroy();
  });

  it('Initialize', function () {
    const $element = $compile('<ml-explorer-chart />')($scope);
    $scope.$digest();

    // without setting any attributes and corresponding data
    // the directive just ends up being empty.
    expect($element.find('.content-wrapper').html()).to.be('');
  });
});
