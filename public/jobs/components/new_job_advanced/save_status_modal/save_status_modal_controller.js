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

import _ from 'lodash';
import stringUtils from 'plugins/ml/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.controller('PrlSaveStatusModal', function ($scope, $location, $modalInstance, params) {

  $scope.pscope = params.pscope;
  $scope.ui = {
    showUploadStatus: params.showUploadStatus,
    showTimepicker: false,
  };

  // return to jobs list page and open the scheduler modal for the new job
  $scope.openScheduler = function () {
    $location.path('jobs');
    $modalInstance.close();
    params.openScheduler();
  };

  // once the job is saved and optional upload is complete.
  // close modal and return to jobs list
  $scope.close = function () {
    if ($scope.pscope.ui.saveStatus.job === 2 &&
      ($scope.ui.showUploadStatus === false ||
      ($scope.ui.showUploadStatus === true && $scope.pscope.ui.saveStatus.upload === 2))) {
      $location.path('jobs');
    }

    $scope.pscope.ui.saveStatus.job = 0;
    $scope.pscope.ui.saveStatus.upload = 0;
    $modalInstance.dismiss('cancel');
  };

});
