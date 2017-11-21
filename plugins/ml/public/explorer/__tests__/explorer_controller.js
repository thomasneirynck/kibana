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

describe('ML - Explorer Controller', function () {
  beforeEach(() => {
    ngMock.module('kibana');
  });

  it('Initialize Explorer Controller', function () {
    ngMock.inject(function ($rootScope, $controller) {
      const scope = $rootScope.$new();
      $controller('MlExplorerController', { $scope: scope });

      expect(scope.limitSwimlaneOptions).to.eql([5, 10, 25, 50]);
      expect(scope.swimlaneLimit).to.equal(10);
      expect(scope.showCharts).to.be.true;
    });
  });
});
