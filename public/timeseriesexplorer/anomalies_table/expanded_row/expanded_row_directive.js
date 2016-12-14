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

/*
 * Angular directive for rendering the expanded row content in the
 * Prelert Anomaly Summary table Kibana visualization. It displays
 * more details on the anomaly summarized in the row, including
 * field names, actual and typical values for the analyzed metric,
 * plus causes and examples events according to the detector configuration.
 */

import _ from 'lodash';
import moment from 'moment';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import 'plugins/prelert/filters/time_of_week';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlAnomaliesTableExpandedRow', function () {

  function link(scope, element, $attrs) {
    scope.record = scope.$parent.record;
    scope.filter = scope.$parent.filter;
    scope.isShowingAggregatedData = scope.$parent.isShowingAggregatedData;

    const timeFieldName = '@timestamp';
    const stringTime = scope.record.source[timeFieldName];
    const momentTime = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
    scope.anomalyTime = momentTime.format('MMMM Do YYYY, HH:mm:ss');
    if (_.has(scope.record.source, 'bucketSpan')) {
      scope.anomalyEndTime = momentTime.add(scope.record.source.bucketSpan, 's').format('MMMM Do YYYY, HH:mm:ss');
    }

    scope.$on('initRow', function (event, record) {
      // Only build the description and details on metric values,
      // causes and influencers when the row is first expanded.
      buildContent();
    });

    if (scope.$parent.open === true) {
      // Build the content if the row was already open before re-render (e.g. when sorting),
      buildContent();
    }

    if (_.has(scope.record, 'entityValue') && scope.record.entityName === 'prelertcategory') {
      // For categorization results, controller will obtain the definition when the
      // row is first expanded and place the categoryDefinition in the row scope.
      const unbindWatch = scope.$parent.$watch('categoryDefinition', function (categoryDefinition) {
        if (categoryDefinition !== undefined) {
          scope.examples = categoryDefinition.examples;
          unbindWatch();
        }
      });
    }

    function buildContent() {
      buildDescription();
      buildMetrics();
      buildCauses();
      buildInfluencers();
    }

    function buildDescription() {
      const record = scope.record;
      let rowDescription = anomalyUtils.getSeverity(record.source.normalizedProbability) + ' anomaly in ' + record.detector;

      if (_.has(record, 'entityName')) {
        rowDescription += ' found for ' + record.entityName;
        rowDescription += ' ';
        rowDescription += record.entityValue;
      }

      if (_.has(record.source, 'partitionFieldName') && (record.source.partitionFieldName !== record.entityName)) {
        rowDescription += ' detected in ' + record.source.partitionFieldName;
        rowDescription += ' ';
        rowDescription += record.source.partitionFieldValue;
      }

      scope.description = rowDescription;

      // Check for a correlatedByFieldValue in the source which will be present for multivariate analyses
      // where the record is anomalous due to relationship with another 'by' field value.
      if (_.has(record.source, 'correlatedByFieldValue')) {
        let mvDescription = 'multivariate correlations found in ';
        mvDescription += record.source.byFieldName;
        mvDescription += '; ';
        mvDescription += record.source.byFieldValue;
        mvDescription += ' is considered anomalous given ';
        mvDescription += record.source.correlatedByFieldValue;
        scope.multiVariateDescription = mvDescription;
      }


      // Display a warning below the description if the record is an interim result.
      scope.isInterim = _.get(record, 'source.isInterim', false);
    }

    function buildMetrics() {
      const record = scope.record;
      const functionDescription = _.get(record, 'source.functionDescription', '');
      if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
        if (!_.has(scope.record.source, 'causes')) {
          scope.actual = record.source.actual;
          scope.typical = record.source.typical;
        } else {
          const causes = scope.record.source.causes;
          if (causes.length === 1) {
            // If only one 'cause', move values to top level.
            const cause = _.first(causes);
            scope.actual = cause.actual;
            scope.typical = cause.typical;
          }
        }
      }
    }

    function buildCauses() {
      if (_.has(scope.record.source, 'causes')) {
        const causes = scope.record.source.causes;

        // TODO - build different information depending on whether function is rare, freq_rare or another.

        // TODO - look in each cause for a 'correlatedByFieldValue' field,
        //    and if so, add to causes scope object for rendering in the template.
        if (causes.length === 1) {
          // Metrics and probability will already have been placed at the top level.
          // If cause has byFieldValue, move it to a top level fields for display.
          const cause = _.first(causes);
          if (_.has(cause, 'byFieldName')) {
            scope.singleCauseByFieldName = cause.byFieldName;
            scope.singleCauseByFieldValue = cause.byFieldValue;
          }
        } else {
          scope.causes = _.map(causes, function (cause) {
            const simplified = _.pick(cause, 'typical', 'actual', 'probability');
            // Get the 'entity field name/value' to display in the cause -
            // For by and over, use byFieldName/Value (overFieldName/Value are in the toplevel fields)
            // For just an 'over' field - the overFieldName/Value appear in both top level and cause.
            simplified.entityName = _.has(cause, 'byFieldName') ? cause.byFieldName : cause.overFieldName;
            simplified.entityValue = _.has(cause, 'byFieldValue') ? cause.byFieldValue : cause.overFieldValue;
            return simplified;
          });
        }

      }
    }

    function buildInfluencers() {
      if (_.has(scope.record, 'influencers')) {
        const influencers = [];
        _.each(scope.record.influencers, function (influencer) {
          _.each(influencer, function (influencerFieldValue, influencerFieldName) {
            influencers.push({'name':influencerFieldName, 'value': influencerFieldValue});
          });
        });
        scope.influencers = influencers;
      }
    }
  }


  return {
    restrict: 'AE',
    replace: false,
    scope: {},
    template: require('plugins/prelert/timeseriesexplorer/anomalies_table/expanded_row/expanded_row.html'),
    link: link
  };
});
