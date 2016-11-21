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

/*
 * Angular directive for rendering the expanded row content in the
 * Prelert Anomaly Summary table Kibana visualization. It displays
 * more details on the anomaly summarized in the row, including
 * field names, actual and typical values for the analyzed metric,
 * plus causes and examples events according to the detector configuration.
 */

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import moment from 'moment';

import 'plugins/prelert/filters/time_of_week';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlAnomalySummaryExpandedRow', function () {

function link($scope, $element, $attrs) {
  $scope.record = $scope.$parent.record;
  $scope.filter = $scope.$parent.filter;
  $scope.isShowingAggregatedData = $scope.$parent.isShowingAggregatedData;

  var stringTime = $scope.record.source[$scope.$parent.indexPattern.timeFieldName];
  var momentTime = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
  $scope.anomalyTime = momentTime.format('MMMM Do YYYY, HH:mm:ss');
  if (_.has($scope.record.source, 'bucketSpan')) {
    $scope.anomalyEndTime = momentTime.add($scope.record.source.bucketSpan, 's').format('MMMM Do YYYY, HH:mm:ss');
  }

  $scope.$on('initRow', function(event, record){
    // Only build the description and details on metric values,
    // causes and influencers when the row is first expanded.
    buildContent();
  });

  if ($scope.$parent.open === true) {
    // Build the content if the row was already open before re-render (e.g. when sorting),
    buildContent();
  }

  if (_.has($scope.record, 'entityValue') && $scope.record.entityName === 'prelertcategory') {
    // For categorization results, controller will obtain the definition when the
    // row is first expanded and place the categoryDefinition in the row scope.
    var unbindWatch = $scope.$parent.$watch('categoryDefinition', function(categoryDefinition) {
      if (categoryDefinition !== undefined) {
        $scope.examples = categoryDefinition.examples;
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
    var record = $scope.record;
    var rowDescription = anomalyUtils.getSeverity(record.source.normalizedProbability) + " anomaly in " + record.detector;

    if (_.has(record, 'entityName')) {
      rowDescription += " found for " + record.entityName;
      rowDescription += " ";
      rowDescription += record.entityValue;
    }

    if (_.has(record.source, 'partitionFieldName') && (record.source.partitionFieldName != record.entityName) ) {
      rowDescription += " detected in " + record.source.partitionFieldName;
      rowDescription += " ";
      rowDescription += record.source.partitionFieldValue;
    }

    $scope.description = rowDescription;

    // Check for a correlatedByFieldValue in the source which will be present for multivariate analyses
    // where the record is anomalous due to relationship with another 'by' field value.
    if (_.has(record.source, 'correlatedByFieldValue')) {
      var mvDescription = "multivariate correlations found in ";
      mvDescription += record.source.byFieldName;
      mvDescription += "; ";
      mvDescription += record.source.byFieldValue;
      mvDescription += " is considered anomalous given ";
      mvDescription += record.source.correlatedByFieldValue;
      $scope.multiVariateDescription = mvDescription;
    }


    // Display a warning below the description if the record is an interim result.
    $scope.isInterim = _.get(record, 'source.isInterim', false);
  }

  function buildMetrics() {
    var record = $scope.record;
    var functionDescription = _.get(record, 'source.functionDescription', '');
    if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
      if (!_.has($scope.record.source, 'causes')) {
        $scope.actual = record.source.actual;
        $scope.typical = record.source.typical;
      } else {
        var causes = $scope.record.source.causes;
        if (causes.length == 1) {
          // If only one 'cause', move values to top level.
          var cause = _.first(causes);
          $scope.actual = cause.actual;
          $scope.typical = cause.typical;
        }
      }
    }
  }

  function buildCauses() {
    if (_.has($scope.record.source, 'causes')) {
      var causes = $scope.record.source.causes;

      // TODO - build different information depending on whether function is rare, freq_rare or another.

      // TODO - look in each cause for a 'correlatedByFieldValue' field,
      //    and if so, add to causes scope object for rendering in the template.
      if (causes.length === 1) {
        // Metrics and probability will already have been placed at the top level.
        // If cause has byFieldValue, move it to a top level fields for display.
        var cause = _.first(causes);
        if (_.has(cause, 'byFieldName')) {
          $scope.singleCauseByFieldName = cause.byFieldName;
          $scope.singleCauseByFieldValue = cause.byFieldValue;
        }
      } else {
        $scope.causes = _.map(causes, function(cause){
          var simplified = _.pick(cause, 'typical', 'actual', 'probability');
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
    if (_.has($scope.record, 'influencers')) {
      var influencers = [];
      _.each($scope.record.influencers, function(influencer){
        _.each(influencer, function(influencerFieldValue, influencerFieldName){
          influencers.push({'name':influencerFieldName, 'value': influencerFieldValue});
        });
      });
      $scope.influencers = influencers;
    }
  }
}


return {
  restrict: 'AE',
  replace: false,
  scope: {},
  template: require('plugins/prelert/anomalysummarytable/expanded_row/expanded_row.html'),
  link: link
  };
});
