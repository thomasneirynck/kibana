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

import angular from 'angular';
import _ from 'lodash';
import 'plugins/prelert/jobs/components/new_job_advanced/detector_modal';
import 'plugins/prelert/jobs/components/new_job_advanced/detector_filter_modal';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobDetectorsList', function ($modal, $q, prlJobService) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      detectors:            '=prlDetectors',
      indices:              '=prlIndices',
      properties:           '=prlProperties',
      catFieldNameSelected: '=prlCatFieldNameSelected',
      editMode:             '=prlEditMode',
    },
    template: require('plugins/prelert/jobs/components/new_job_advanced/detectors_list.html'),
    controller: function ($scope) {

      $scope.addDetector = function (dtr, index) {
        if (dtr !== undefined) {
          if (index >= 0) {
            $scope.detectors[index] = dtr;
          } else {
            $scope.detectors.push(dtr);
          }
        }
      };

      $scope.removeDetector = function (index) {
        $scope.detectors.splice(index, 1);
      };

      $scope.editDetector = function (index) {
        $scope.openNewWindow(index);
      };

      $scope.info = function (dtr) {

      };

      // add a filter to the detector
      // called from inside the filter modal
      $scope.addFilter = function (dtr, filter, filterIndex) {
        if (dtr.detectorRules === undefined) {
          dtr.detectorRules = [];
        }

        if (filterIndex >= 0) {
          dtr.detectorRules[filterIndex] = filter;
        } else {
          dtr.detectorRules.push(filter);
        }
      };

      $scope.removeFilter = function (detector, filterIndex) {
        detector.detectorRules.splice(filterIndex, 1);
      };

      $scope.editFilter = function (detector, index) {
        $scope.openFilterWindow(detector, index);
      };


      $scope.detectorToString = stringUtils.detectorToString;

      function validateDetector(dtr) {

        // locally check excludeFrequent as it can only be 'true', 'false', 'by' or 'over'
        if (dtr.excludeFrequent !== undefined && dtr.excludeFrequent !== '') {
          const exFrqs = ['true', 'false', 'by', 'over'];
          if (_.indexOf(exFrqs, dtr.excludeFrequent.trim()) === -1) {
            // return a pretend promise
            return {
              then: function (callback) {
                callback({
                  success: false,
                  message: 'excludeFrequent value must be: "true", "false", "by" or "over"'
                });
              }
            };
          }
        }

        // post detector to server for in depth validation
        return prlJobService.validateDetector(dtr)
        .then((resp) => {
          return {
            success: (resp.acknowledgement || false)
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
        let dtr;
        if (index >= 0) {
          dtr = angular.copy($scope.detectors[index]);
        }
        const modalInstance = $modal.open({
          template: require('plugins/prelert/jobs/components/new_job_advanced/detector_modal/detector_modal.html'),
          controller: 'PrlDetectorModal',
          backdrop: 'static',
          keyboard: false,
          size: 'lg',
          resolve: {
            params: function () {
              return {
                properties:           $scope.properties,
                validate:             validateDetector,
                detector:             dtr,
                index:                index,
                add:                  $scope.addDetector,
                catFieldNameSelected: $scope.catFieldNameSelected
              };
            }
          }
        });
      };

      $scope.openFilterWindow = function (dtr, filterIndex) {
        filterIndex = (filterIndex !== undefined ? filterIndex : -1);
        let filter;
        if (filterIndex >= 0) {
          filter = angular.copy(dtr.detectorRules[filterIndex]);
        }
        const modalInstance = $modal.open({
          template: require('plugins/prelert/jobs/components/new_job_advanced/detector_filter_modal/detector_filter_modal.html'),
          controller: 'PrlDetectorFilterModal',
          backdrop: 'static',
          keyboard: false,
          size: 'lg',
          resolve: {
            params: function () {
              return {
                properties:           $scope.properties,
                validate:             validateDetector,
                detector:             dtr,
                filter:               filter,
                index:                filterIndex,
                add:                  $scope.addFilter
              };
            }
          }
        });
      };
    }
  };
});
