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
 * Angular controller for the Prelert influencer list visualization.
 * The controller processes the total score and maximum score aggregations
 * received from Elasticsearch, placing a metricsData object in scope containing
 * the data in the appropriate format for rendering a list of the top influencers
 * by field name and value.
 */
import _ from 'lodash';
import $ from 'jquery';

import 'plugins/prelert/lib/angular_bootstrap_patch';
import 'plugins/prelert/filters/abbreviate_whole_number';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import FilterManagerProvider from 'ui/filter_manager';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlInfluencersListController', function($scope, Private) {
  
  const filterManager = Private(FilterManagerProvider);
  
  $scope.$watch('esResponse', function (resp) {
    
    if (!resp) {
      return;
    }
    
    console.log("PrlInfluencersListController esResponse:", resp);
    
    // Process the aggregations in the ES response which provide the data for the chart.
    $scope.processAggregations(resp.aggregations);
    
  });
  
  $scope.processAggregations = function (aggregations) {
    
    var dataByViewBy = {};
    
    if (aggregations) {
      // Retrieve the ids of the configured viewBy aggregations.
      var viewBy1AggId = $scope.vis.aggs.bySchemaName['viewBy1'][0].id;   // e.g. for 'influencerFieldName'
      var viewBy2AggId = $scope.vis.aggs.bySchemaName['viewBy2'][0].id;   // e.g. for 'influencerFieldValue'
      
      // Retrieve the 'maxScore' and 'totalScore' metric aggregations.
      var maxScoreAgg = $scope.vis.aggs.bySchemaName['maxScore'][0];    // e.g. for max(anomalyScore)
      var totalScoreAgg = $scope.vis.aggs.bySchemaName['totalScore'][0];  // e.g. for sum(anomalyScore)
      
      // Get the buckets of the top-level aggregation
      var buckets = aggregations[viewBy1AggId].buckets;
      
      // Get the labels for the two metric aggregations, used in the tooltip.
      var maxScoreMetricLabel = maxScoreAgg.makeLabel();
      var totalScoreMetricLabel = totalScoreAgg.makeLabel(); 
      
      var compiledTooltip = _.template('<div class="prl-influencers-list-tooltip"><%= influencerFieldName %>: <%= influencerFieldValue %>' +
        '<hr/><%= maxScoreMetricLabel %>: <%= maxScoreValue %>'+
        '<hr/><%= totalScoreMetricLabel %>: <%= totalScoreValue %></div>');
      
      _.each(buckets, function(bucket){
        var influencerFieldName = bucket.key;
        var valuesForViewBy = [];
        
        var bucketsForViewByValue = bucket[viewBy2AggId].buckets;
        
        _.each(bucketsForViewByValue, function(valueBucket) {
          var maxScorePrecise = maxScoreAgg.getValue(valueBucket);
          var maxScore = parseInt(maxScorePrecise);
          var totalScore = parseInt(totalScoreAgg.getValue(valueBucket));
          var barScore = maxScore != 0 ? maxScore: 1;
          var maxScoreLabel = maxScore != 0 ? maxScore: '< 1';
          var totalScoreLabel = totalScore != 0 ? totalScore: '< 1';
          var severity = anomalyUtils.getSeverity(maxScore);
          
          // Store the data for each influencerfieldname in an array to ensure 
          // reliable sorting by max score.
          // If it was sorted as an object, the order when rendered using the AngularJS
          // ngRepeat directive could not be relied upon to be the same as they were 
          // returned in the ES aggregation e.g. for numeric keys from a prelertcategory influencer.
          valuesForViewBy.push({
            'influencerFieldValue':valueBucket.key,
            'maxScorePrecise': maxScorePrecise,
            'barScore': barScore,
            'maxScoreLabel': maxScoreLabel,
            'totalScore': totalScore,
            'severity': severity,
            'tooltip': compiledTooltip({
              'influencerFieldName':influencerFieldName,
              'influencerFieldValue':valueBucket.key,
              'maxScoreMetricLabel':maxScoreMetricLabel,
              'maxScoreValue':maxScoreLabel,
              'totalScoreMetricLabel':totalScoreMetricLabel,
              'totalScoreValue':totalScoreLabel
            })
          });
        });
        
        dataByViewBy[influencerFieldName] = _.sortBy(valuesForViewBy, 'maxScorePrecise').reverse();
      });
      console.log("PrlInfluencersListController processAggregations processed data:", dataByViewBy);
      
    }

    $scope.metricsData = dataByViewBy;
 
  };
  
  // Provide a filter function so filters can be added from expanded table rows.
  $scope.filter = function (field, value, operator) {
    filterManager.add(field, value, operator, $scope.vis.indexPattern.id);
  };

});
