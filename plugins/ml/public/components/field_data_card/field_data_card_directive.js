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
import chrome from 'ui/chrome';
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

    // Refresh the data when the time range is altered.
    scope.$listen(timefilter, 'fetch', () => {
      scope.earliest = timefilter.getActiveBounds().min.valueOf();
      scope.latest = timefilter.getActiveBounds().max.valueOf();

      loadStats();
    });

    scope.detailsModeChanged = function (mode) {
      scope.detailsMode = mode;
      if (scope.detailsMode === 'distribution') {
        $timeout(() => {
          scope.$broadcast('renderChart');
        }, 0);
      }
    };

    scope.getCardUrl = function () {
      const urlBasePath = chrome.getBasePath();
      const baseCardPath = `${urlBasePath}/plugins/ml/components/field_data_card/content_types`;
      const cardType = scope.cardConfig.type;
      switch (cardType) {
        case DATA_VISUALIZER_FIELD_TYPES.BOOLEAN:
          return `${baseCardPath}/card_boolean.html`;
        case DATA_VISUALIZER_FIELD_TYPES.DATE:
          return `${baseCardPath}/card_date.html`;
        case DATA_VISUALIZER_FIELD_TYPES.GEO_POINT:
          return `${baseCardPath}/card_geo_point.html`;
        case DATA_VISUALIZER_FIELD_TYPES.IP:
          return `${baseCardPath}/card_ip.html`;
        case DATA_VISUALIZER_FIELD_TYPES.KEYWORD:
          return `${baseCardPath}/card_keyword.html`;
        case DATA_VISUALIZER_FIELD_TYPES.NUMBER:
          if (scope.cardConfig.fieldName) {
            return `${baseCardPath}/card_number.html`;
          } else {
            return `${baseCardPath}/card_document_count.html`;
          }
        case DATA_VISUALIZER_FIELD_TYPES.TEXT:
          return `${baseCardPath}/card_text.html`;
        default:
          return `${baseCardPath}/card_other.html`;
      }
    };

    element.on('$destroy', () => {
      scope.$destroy();
    });

    function loadStats() {
      const config = scope.cardConfig;
      switch (config.type) {
        case DATA_VISUALIZER_FIELD_TYPES.NUMBER:
          if (scope.cardConfig.fieldName) {
            mlFieldDataSearchService.getAggregatableFieldStats(
              scope.indexPattern.title,
              scope.query,
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
                $timeout(() => {
                  scope.$broadcast('renderChart');
                }, 0);
              }
            });
          }
          break;
        case DATA_VISUALIZER_FIELD_TYPES.BOOLEAN:
        case DATA_VISUALIZER_FIELD_TYPES.DATE:
        case DATA_VISUALIZER_FIELD_TYPES.IP:
        case DATA_VISUALIZER_FIELD_TYPES.KEYWORD:
          mlFieldDataSearchService.getAggregatableFieldStats(
            scope.indexPattern.title,
            scope.query,
            config.fieldName,
            config.type,
            scope.indexPattern.timeFieldName,
            scope.earliest,
            scope.latest)
          .then((resp) => {
            scope.stats = resp.stats;
          });
          break;
        case DATA_VISUALIZER_FIELD_TYPES.TEXT:
          mlFieldDataSearchService.getFieldExamples(
            scope.indexPattern.title,
            scope.query,
            config.fieldName,
            10,
            scope.indexPattern.timeFieldName,
            scope.earliest,
            scope.latest)
          .then((resp) => {
            scope.examples = resp.examples;
          });
          break;
        default:
          if (config.aggregatable === true) {
            mlFieldDataSearchService.getAggregatableFieldStats(
              scope.indexPattern.title,
              scope.query,
              config.fieldName,
              config.type,
              scope.indexPattern.timeFieldName,
              scope.earliest,
              scope.latest)
            .then((resp) => {
              scope.stats = resp.stats;
              scope.examples = resp.examples;
            });
          } else {
            mlFieldDataSearchService.getFieldExamples(
              scope.indexPattern.title,
              scope.query,
              config.fieldName,
              10,
              scope.indexPattern.timeFieldName,
              scope.earliest,
              scope.latest)
            .then((resp) => {
              scope.examples = resp.examples;
            });
          }
          break;
      }
    }

    if (scope.cardConfig.existsInDocs) {
      loadStats();
    }

  }

  return {
    scope: {
      cardConfig: '=',
      indexPattern: '=',
      query: '=',
      earliest: '=',
      latest: '='
    },
    template: require('plugins/ml/components/field_data_card/field_data_card.html'),
    link: link
  };
})
.filter('formatField', function () {
  // Filter to format the value of a field according to the defined format
  // of the field in the index pattern.
  return function (value, fieldFormat) {
    return fieldFormat.convert(value, 'text');
  };
});
