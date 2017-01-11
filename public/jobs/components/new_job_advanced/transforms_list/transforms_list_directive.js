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

// directive for displaying detectors form list.

import chrome from 'ui/chrome';
import stringUtils from 'plugins/ml/util/string_utils';
import angular from 'angular';
import 'plugins/ml/jobs/components/new_job_advanced/transform_modal';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlJobTransformsList', function ($modal, $q, mlJobService) {

  return {
    restrict: 'AE',
    replace: true,
    scope: {
      transforms:                '=mlTransforms',
      detectors:                 '=mlDetectors',
      indexes:                   '=mlIndexes',
      properties:                '=mlProperties',
      influencers:               '=mlInfluencers',
      addTransformsToProperties: '=mlAddTransformsToProperties',
      dataFormat:                '=mlDataFormat'
    },
    template: require('plugins/ml/jobs/components/new_job_advanced/transforms_list/transforms_list.html'),
    controller: function ($scope, mlTransformsDefaultOutputs) {

      $scope.DEFAULT_OUTPUTS = mlTransformsDefaultOutputs;
      $scope.urlBasePath = chrome.getBasePath();

      $scope.addTransform = function (trfm, index) {
        if ($scope.transforms) {
          if (trfm !== undefined) {
            if (index >= 0) {
              $scope.transforms[index] = trfm;
            } else {
              $scope.transforms.push(trfm);
            }
          }
        }

        $scope.addTransformsToProperties();

      };

      $scope.removeTransform = function (index) {
        $scope.transforms.splice(index, 1);
        $scope.addTransformsToProperties();
      };

      $scope.editTransform = function (index) {
        $scope.openNewWindow(index);
      };

      $scope.detectorToString = stringUtils.detectorToString;

      function validateTransform(trfm, index) {
        // create a copy of the whole transforms array, add this new transform to
        // test for compatibility issues.
        const tempTransforms = angular.copy($scope.transforms);
        // if this is an edit, replace the transform in the list
        if (index >= 0) {
          tempTransforms[index] = trfm;
        } else {
          tempTransforms.push(trfm);
        }

        // send to endpoint for validation
        return mlJobService.validateTransforms(tempTransforms)
        .then((resp) => {
          return {
            success: (resp.acknowledged || false)
          };
        })
        .catch((resp) => {
          return {
            success: false,
            message: (resp.message || 'Validation failed')
          };
        });
      }


      $scope.openNewWindow = function (index) {
        index = (index !== undefined ? index : -1);
        let trfm;
        if (index >= 0) {
          trfm = angular.copy($scope.transforms[index]);
        }
        const modalInstance = $modal.open({
          template: require('plugins/ml/jobs/components/new_job_advanced/transform_modal/transform_modal.html'),
          controller: 'MlTransformModal',
          backdrop: 'static',
          keyboard: false,
          size: 'lg',
          resolve: {
            params: function () {
              return {
                transforms:       $scope.transforms,
                properties:       $scope.properties,
                validate:         validateTransform,
                transform:        trfm,
                index:            index,
                add:              $scope.addTransform,
                DEFAULT_OUTPUTS:  $scope.DEFAULT_OUTPUTS,
                dataFormat:       $scope.dataFormat
              };
            }
          }
        });
      };

    }
  };
})
.constant('mlTransformsDefaultOutputs', {
  domain_split: ['subDomain', 'hrd'],
  concat:       ['concat'],
  extract:      ['extract'],
  split:        ['split'],
  trim:         ['trim'],
  lowercase:    ['lowercase'],
  uppercase:    ['uppercase'],
  geo_unhash:   ['latLong']
});
