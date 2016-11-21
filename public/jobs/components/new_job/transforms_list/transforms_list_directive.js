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

import chrome from 'ui/chrome';
import stringUtils from 'plugins/prelert/util/string_utils';
import 'plugins/prelert/jobs/components/new_job/transform_modal';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobTransformsList', function($modal, $q, prlJobService) {

  return {
    restrict: 'AE',
    replace: true,
    scope: {
      transforms:                '=prlTransforms',
      detectors:                 '=prlDetectors',
      indices:                   '=prlIndices',
      properties:                '=prlProperties',
      influencers:               '=prlInfluencers',
      addTransformsToProperties: '=prlAddTransformsToProperties',
      dataFormat:                '=prlDataFormat'
    },
    template: require('plugins/prelert/jobs/components/new_job/transforms_list/transforms_list.html'),
    controller: function($scope, prlTransformsDefaultOutputs){

      $scope.DEFAULT_OUTPUTS = prlTransformsDefaultOutputs;
      $scope.urlBasePath = chrome.getBasePath();

      $scope.addTransform = function(trfm, index) {
        if($scope.transforms) {
          if(trfm !== undefined) {
            if(index >= 0) {
              $scope.transforms[index] = trfm;
            } else {
              $scope.transforms.push(trfm);
            }
          }
        }

        $scope.addTransformsToProperties();

      };

      $scope.removeTransform = function(index) {
        $scope.transforms.splice(index, 1);
        $scope.addTransformsToProperties();
      };

      $scope.editTransform = function(index) {
        $scope.openNewWindow(index);
      };

      $scope.detectorToString = stringUtils.detectorToString;

      function validateTransform(trfm, index) {
        // create a copy of the whole transforms array, add this new transform to
        // test for compatibility issues.
        var tempTransforms = angular.copy($scope.transforms);
        // if this is an edit, replace the transform in the list
        if(index >= 0) {
          tempTransforms[index] = trfm;
        } else {
          tempTransforms.push(trfm);
        }

        // send to endpoint for validation
        return prlJobService.validateTransforms(tempTransforms)
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
        var trfm;
        if(index >= 0) {
          trfm = angular.copy($scope.transforms[index]);
        }
        var modalInstance = $modal.open({
          template: require('plugins/prelert/jobs/components/new_job/transform_modal/transform_modal.html'),
          controller: 'PrlTransformModal',
          backdrop: "static",
          keyboard: false,
          size: "lg",
          resolve: {
            params: function() {
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
.constant('prlTransformsDefaultOutputs', {
  domain_split: ["subDomain", "hrd"],
  concat:       ["concat"],
  extract:      ["extract"],
  split:        ["split"],
  trim:         ["trim"],
  lowercase:    ["lowercase"],
  uppercase:    ["uppercase"],
  geo_unhash:   ["latLong"]
});
