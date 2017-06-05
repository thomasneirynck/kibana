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

import _ from 'lodash';

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
        $scope.ui.bucketSpanEstimator.status = 1;
        $scope.ui.bucketSpanEstimator.message = '';
        // debugger
        const aggTypes = [];
        const fields = [];

        if ($scope.formConfig.fields === undefined) {
          // single metric config
          const fieldName = ($scope.formConfig.field === null) ?
            null : $scope.formConfig.field.id;
          fields.push(fieldName);
          aggTypes.push($scope.formConfig.agg.type);
        } else {
          // multi metric config
          _.each($scope.formConfig.fields, (field, key) => {
            const fieldName = (key === '__ml_event_rate_count__') ? null : key;
            fields.push(fieldName);
            aggTypes.push(field.agg.type);
          });
        }

        const bss = new BucketSpanEstimator(
          $scope.formConfig.indexPattern.id,
          $scope.formConfig.timeField,
          aggTypes,
          fields,
          {
            start: $scope.formConfig.start,
            end: $scope.formConfig.end
          });
        bss.run().then((interval) => {
          // console.log(interval);
          $scope.formConfig.bucketSpan = interval.name;
          $scope.$applyAsync();
          $scope.ui.bucketSpanEstimator.status = 2;
        })
        .catch((resp) => {
          console.log('Bucket span could not be estimated', resp);
          $scope.ui.bucketSpanEstimator.status = -1;
          $scope.ui.bucketSpanEstimator.message = 'Bucket span could not be estimated';
          $scope.$applyAsync();
        });
      };
    }
  };
});
