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

import template from './influencers_selection.html';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlInfluencersSelection', function () {
  return {
    restrict: 'E',
    replace: true,
    template,
    controller: function ($scope) {

      // is the field passed in being used as a split field?
      // called from html. split fields can't be removed from the influencer list
      $scope.isSplitField = function (field) {
        const splitFields = getSplitFields();
        return (splitFields.find(f => f === field) !== undefined);
      };

      $scope.toggleSplitField = function () {
        $scope.addSplitFieldsToInfluencerList();
      };

      // force add the split fields to the front of the influencer list.
      // as we have no control over the ui-select remove "x" link on each pill, if
      // the user removes a split field, this function will put it back in again.
      $scope.addSplitFieldsToInfluencerList = function () {
        const splitFields = getSplitFields();
        const nonSplitFields = $scope.formConfig.influencerFields.filter(f => {
          return (splitFields.find(sp => sp === f) === undefined);
        });
        $scope.formConfig.influencerFields = splitFields.concat(nonSplitFields);
      };

      // get the split fields from either each selected field (for population jobs)
      // or from the global split field (multi-metric jobs)
      function getSplitFields() {
        if ($scope.formConfig.hasOwnProperty('splitField') === false) {
          const splitFields = $scope.formConfig.fields.map(f => f.splitField);
          return splitFields.filter(f => f !== '');
        } else {
          if ($scope.formConfig.splitField === undefined) {
            return [];
          } else {
            return [$scope.formConfig.splitField];
          }
        }
      }
    }
  };
});
