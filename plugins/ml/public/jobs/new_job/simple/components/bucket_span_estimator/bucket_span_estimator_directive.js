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

import template from './bucket_span_estimator.html';
import { BucketSpanEstimatorProvider } from './bucket_span_estimator';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlBucketSpanEstimator', function ($q, Private) {
  return {
    restrict: 'AE',
    replace: false,
    scope: {
      formConfig: '=',
      jobStateWrapper: '=',
      JOB_STATE: '=jobState',
      ui: '=ui'
    },
    template,
    link: function ($scope) {
      const BucketSpanEstimator = Private(BucketSpanEstimatorProvider);
      $scope.jobState = $scope.jobStateWrapper.jobState;

      $scope.guessBucketSpan = function () {
        const field = ($scope.formConfig.field === null) ?
          null : $scope.formConfig.field.id;

        const bss = new BucketSpanEstimator(
          $scope.formConfig.indexPattern.id,
          $scope.formConfig.timeField,
          $scope.formConfig.agg.type,
          field,
          {
            start: $scope.formConfig.start,
            end: $scope.formConfig.end
          });
        bss.run().then((interval) => {
          // console.log(interval);
          $scope.formConfig.bucketSpan = interval.name;
          $scope.$applyAsync();
        });
      };
    }
  };
});
