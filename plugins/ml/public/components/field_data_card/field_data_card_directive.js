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

/*
 * AngularJS directive for rendering a card showing data on a field in an index pattern.
 */

import _ from 'lodash';
import $ from 'jquery';
import 'ui/filters/moment';

import { DATA_VISUALIZER_FIELD_TYPES } from 'plugins/ml/constants/field_types';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlFieldDataCard', function ($timeout, mlFieldDataSearchService, timefilter) {

  function link(scope, element) {
    scope.stats = {};
    scope.detailsMode = 'top';
    scope.DATA_VISUALIZER_FIELD_TYPES = DATA_VISUALIZER_FIELD_TYPES;

    if (scope.cardConfig.type === DATA_VISUALIZER_FIELD_TYPES.NUMBER) {
      // Create a div for the chart tooltip.
      $('.ml-field-data-card-tooltip').remove();
      $('body').append('<div class="ml-field-data-card-tooltip" style="opacity:0; display: none;">');
    }


    // scope.$watch('cardConfig', () => {
    //   console.log('!!! mlFieldDataCard cardConfig watch :');
    //   if (scope.cardConfig.field !== undefined) {
    //     loadStats();

    //     // TODO - different actions for different components in the details area.
    //     scope.$broadcast('renderChart');
    //   }

    // }, true);

    // TODO - should the directive listen for changes to the timefilter,
    //        or do by watching cardConfig as above?
    // Refresh the data when the time range is altered.
    scope.$listen(timefilter, 'fetch', function () {
      scope.earliest = timefilter.getActiveBounds().min.valueOf();
      scope.latest = timefilter.getActiveBounds().max.valueOf();

      loadStats();

      // TODO - different actions for different components in the details area.
      // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
      // $timeout(function () {
      //   scope.$broadcast('renderChart');
      // }, 0);

    });

    scope.detailsModeChanged = function (mode) {
      scope.detailsMode = mode;
      if (scope.detailsMode === 'distribution') {
        $timeout(function () {
          scope.$broadcast('renderChart');
        }, 0);
      }
    };

    element.on('$destroy', function () {
      scope.$destroy();
    });

    function loadStats() {
      const config = scope.cardConfig;
      switch (config.type) {
        case 'number':
          mlFieldDataSearchService.getFieldStats(
            scope.indexPattern.title,
            config.fieldName,
            config.type,
            scope.indexPattern.timeFieldName,
            scope.earliest,
            scope.latest)
          .then((resp) => {
            const cardinality = _.get(resp, ['stats', 'cardinality'], 0);
            scope.detailsMode = cardinality > 100 ? 'distribution' : 'top';
            scope.stats = resp.stats;
            if (scope.detailsMode === 'distribution') {
              $timeout(function () {
                scope.$broadcast('renderChart');
              }, 0);
            }
          });
          break;
        case 'keyword':
        case 'ip':
        case 'date':
          mlFieldDataSearchService.getFieldStats(
            scope.indexPattern.title,
            config.fieldName,
            config.type,
            scope.indexPattern.timeFieldName,
            scope.earliest,
            scope.latest)
          .then((resp) => {
            scope.stats = resp.stats;
          });
          break;
        case 'text':
        default:
          mlFieldDataSearchService.getFieldExamples(
            scope.indexPattern.title,
            config.fieldName,
            10,
            scope.indexPattern.timeFieldName,
            scope.earliest,
            scope.latest)
          .then((resp) => {
            scope.stats.examples = resp.examples;
          });
          break;
      }
    }

    loadStats();
  }

  return {
    scope: {
      cardConfig: '=',
      indexPattern: '=',
      earliest: '=',
      latest: '='
    },
    template: require('plugins/ml/components/field_data_card/field_data_card.html'),
    link: link
  };
});
