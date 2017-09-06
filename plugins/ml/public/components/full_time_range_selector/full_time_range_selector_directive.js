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

import moment from 'moment';
import template from './full_time_range_selector.html';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlFullTimeRangeSelector', () => {
  return {
    restrict: 'E',
    replace: true,
    template,
    scope: {
      indexPattern: '=',
      disabled: '=',
      query: '='
    },
    controller: function ($scope, timefilter, Notifier, es) {
      const notify = new Notifier();

      // called on button press
      $scope.setFullTimeRange = function () {
        indexTimeRange()
        .then((resp) => {
          timefilter.time.from = moment(resp.start.epoch).toISOString();
          timefilter.time.to = moment(resp.end.epoch).toISOString();
          $scope.$apply();
        })
        .catch((resp) => {
          notify.error(resp);
          $scope.$apply();
        });
      };

      // load the earliest and latest time stamps for the index
      function indexTimeRange() {
        return new Promise((resolve, reject) => {
          const obj = { success: true, start: { epoch:0, string:'' }, end: { epoch:0, string:'' } };
          const query = $scope.query;

          es.search({
            index: $scope.indexPattern.title,
            size: 0,
            body: {
              query,
              aggs: {
                earliest: {
                  min: {
                    field: $scope.indexPattern.timeFieldName
                  }
                },
                latest: {
                  max: {
                    field: $scope.indexPattern.timeFieldName
                  }
                }
              }
            }
          })
          .then((resp) => {
            if (resp.aggregations && resp.aggregations.earliest && resp.aggregations.latest) {
              obj.start.epoch = resp.aggregations.earliest.value;
              obj.start.string = resp.aggregations.earliest.value_as_string;

              obj.end.epoch = resp.aggregations.latest.value;
              obj.end.string = resp.aggregations.latest.value_as_string;
            }
            resolve(obj);
          })
          .catch((resp) => {
            reject(resp);
          });
        });
      }
    }
  };
});
