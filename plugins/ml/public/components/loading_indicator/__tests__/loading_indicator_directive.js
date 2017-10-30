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

describe('ML - <ml-loading-indicator>', function () {
  let $scope;
  let $compile;
  let $element;

  beforeEach(() => {
    ngMock.module('apps/ml');
    ngMock.inject(function (_$compile_, $rootScope) {
      $compile = _$compile_;
      $scope = $rootScope.$new();
    });
  });

  afterEach(function () {
    $scope.$destroy();
  });

  it('Default loading indicator without attributes should not be visible', function () {
    $element = $compile('<ml-loading-indicator />')($scope);
    $scope.$apply();
    $scope.$on('renderComplete', () => {
      expect($element.find('*').length).to.be(0);
    });
  });

  it('Enables the loading indicator, checks the default height and non-existant label', function () {
    $element = $compile('<ml-loading-indicator is-loading="true" />')($scope);
    $scope.$apply();
    $scope.$on('renderComplete', () => {
      expect($element.find('.loading-indicator').length).to.be(1);
      expect($element.find('.loading-indicator').css('height')).to.be('100px');
      expect($element.find('[ml-loading-indicator-label]').length).to.be(0);
    });
  });

  it('Sets a custom height', function () {
    $element = $compile('<ml-loading-indicator is-loading="true" height="200" />')($scope);
    $scope.$apply();
    $scope.$on('renderComplete', () => {
      expect($element.find('.loading-indicator').css('height')).to.be('200px');
    });
  });

  it('Sets a custom label', function () {
    const labelName = 'my-label';
    $element = $compile(`<ml-loading-indicator is-loading="true" label="${labelName}" />`)($scope);
    $scope.$apply();
    $scope.$on('renderComplete', () => {
      expect($element.find('[ml-loading-indicator-label]').text()).to.be(labelName);
    });
  });

  it('Triggers a scope-change of isLoading', function () {
    $scope.isLoading = false;
    $element = $compile('<ml-loading-indicator is-loading="isLoading" />')($scope);
    $scope.$apply();

    $scope.$on('renderComplete', () => {
      expect($element.find('*').length).to.be(0);

      $scope.isLoading = true;
      $scope.$apply();
      $scope.$on('renderComplete', () => {
        expect($element.find('.loading-indicator').length).to.be(1);
      });
    });
  });
});
