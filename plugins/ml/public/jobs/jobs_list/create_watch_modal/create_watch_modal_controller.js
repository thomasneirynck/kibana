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

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlCreateWatchModal', function ($scope, $modalInstance, params, mlCreateWatchService) {

  $scope.jobId = params.job.job_id;
  $scope.bucketSpan = params.job.analysis_config.bucket_span;

  $scope.watcherEnabled = mlCreateWatchService.isWatcherEnabled();
  $scope.status = mlCreateWatchService.status;
  $scope.STATUS = mlCreateWatchService.STATUS;

  mlCreateWatchService.reset();
  mlCreateWatchService.config.includeInfluencers = params.job.analysis_config.influencers.length ? true : false;

  $scope.apply = function () {
    mlCreateWatchService.createNewWatch($scope.jobId);
  };

  $scope.close = function () {
    $modalInstance.dismiss('cancel');
  };
});
