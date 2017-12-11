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

import tooltips from '../tooltips.json';

describe('ML - <ml-info-icon>', () => {
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

  it('Plain initialization doesn\'t throw an error', () => {
    $element = $compile('<ml-info-icon />')($scope);
    const scope = $element.isolateScope();

    expect(scope.id).to.be.an('undefined');
    expect(scope.text).to.be('');
  });

  it('Initialization with a non-existing tooltip attribute doesn\'t throw an error', () => {
    const id = 'non_existing_attribute';
    $element = $compile(`<i ml-info-icon="${id}" />`)($scope);
    const scope = $element.isolateScope();
    scope.$digest();

    expect(scope.id).to.be(id);
    expect(scope.text).to.be('');
  });
  it('Initialize with existing tooltip attribute', () => {
    const id = 'new_job_id';
    $element = $compile(`<i ml-info-icon="${id}" />`)($scope);
    const scope = $element.isolateScope();
    scope.$digest();

    // test scope values
    expect(scope.id).to.be(id);
    expect(scope.text).to.be(tooltips[id].text);

    // test the rendered span element which should be referenced by aria-describedby
    const span = $element.find('span');
    expect(span[0].id).to.be('ml_aria_description_' + id);
    expect(span.text()).to.be(tooltips[id].text);
  });

});
