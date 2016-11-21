/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */

// directive for displaying detectors form list.

import 'plugins/prelert/jobs/components/new_job/detector_modal';
import 'plugins/prelert/jobs/components/new_job/detector_filter_modal';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobDetectorsList', function($modal, $q, prlJobService) {
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
    template: require('plugins/prelert/jobs/components/new_job/detectors_list.html'),
    controller: function($scope){

      $scope.addDetector = function(dtr, index) {
        if(dtr !== undefined) {
          if(index >= 0) {
            $scope.detectors[index] = dtr;
          } else {
            $scope.detectors.push(dtr);
          }
        }
      };

      $scope.removeDetector = function(index) {
        $scope.detectors.splice(index, 1);
      };

      $scope.editDetector = function(index) {
        $scope.openNewWindow(index);
      };

      $scope.info = function(dtr) {

      };

      // add a filter to the detector
      // called from inside the filter modal
      $scope.addFilter = function(dtr, filter, filterIndex) {
        if(dtr.detectorRules === undefined) {
          dtr.detectorRules = [];
        }

        if(filterIndex >= 0) {
          dtr.detectorRules[filterIndex] = filter;
        } else {
          dtr.detectorRules.push(filter);
        }
      };

      $scope.removeFilter = function(detector, filterIndex) {
        detector.detectorRules.splice(filterIndex, 1);
      };

      $scope.editFilter = function(detector, index) {
        $scope.openFilterWindow(detector, index);
      };


      $scope.detectorToString = stringUtils.detectorToString;

      function validateDetector(dtr) {

        // locally check excludeFrequent as it can only be 'true', 'false', 'by' or 'over'
        if(dtr.excludeFrequent !== undefined && dtr.excludeFrequent !== "") {
          var exFrqs = ["true", "false", "by", "over"];
          if(_.indexOf(exFrqs, dtr.excludeFrequent.trim()) === -1) {
            // return a pretend promise
            return {
                then: function(callback) {
                  callback( {
                  success: false,
                  message: "excludeFrequent value must be: 'true', 'false', 'by' or 'over'"
                });
              }
            };
          }
        }

        // post detector to server for in depth validation
        return prlJobService.validateDetector(dtr)
        .then(function(resp) {
          return {
            success: (resp.acknowledgement || false)
          };
        })
        .catch(function(resp) {
          return {
            success: false,
            message: (resp.message || "Validation failed")
          };
        });
      }

      $scope.openNewWindow = function(index) {
        index = (index !== undefined? index: -1);
        var dtr;
        if(index >= 0) {
          dtr = angular.copy($scope.detectors[index]);
        }
        var modalInstance = $modal.open({
          template: require('plugins/prelert/jobs/components/new_job/detector_modal/detector_modal.html'),
          controller: 'PrlDetectorModal',
          backdrop: "static",
          keyboard: false,
          size: "lg",
          resolve: {
            params: function() {
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

      $scope.openFilterWindow = function(dtr, filterIndex) {
        filterIndex = (filterIndex !== undefined? filterIndex: -1);
        var filter;
        if(filterIndex >= 0) {
          filter = angular.copy(dtr.detectorRules[filterIndex]);
        }
        var modalInstance = $modal.open({
          template: require('plugins/prelert/jobs/components/new_job/detector_filter_modal/detector_filter_modal.html'),
          controller: 'PrlDetectorFilterModal',
          backdrop: "static",
          keyboard: false,
          size: "lg",
          resolve: {
            params: function() {
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
