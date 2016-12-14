/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
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

// the tooltip descriptions are located in tooltips.json

import './styles/main.less';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlEngineApiHelpLink', function () {
  return {
    scope: {
      uri: '@prlUri',
      label: '@prlLabel'
    },
    restrict: 'AE',
    replace: true,
    template: '<a href="{{fullUrl()}}" target="_blank" class="prl-engine-api-help-link" tooltip="{{label}}">' +
                '{{label}}<i class="fa fa-external-link"></i></a>',
    controller: function ($scope) {
      const website = 'http://www.prelert.com/docs/engine_api';
      const version = '2.0';
      $scope.fullUrl = function () {return website + '/' + version + '/' + $scope.uri;};
    }
  };

});
