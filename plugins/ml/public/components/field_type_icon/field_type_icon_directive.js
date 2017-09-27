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

import { ML_JOB_FIELD_TYPES } from 'plugins/ml/util/field_types_utils';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlFieldTypeIcon', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      type: '='
    },
    template: require('plugins/ml/components/field_type_icon/field_type_icon.html'),
    controller: function ($scope) {
      $scope.ML_JOB_FIELD_TYPES = ML_JOB_FIELD_TYPES;
    }
  };
});
