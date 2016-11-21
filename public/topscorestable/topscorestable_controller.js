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
 * Angular controller for the Prelert top scores table.
 * The controller processes the aggregation received from Elasticsearch,
 * placing a metricsData object in scope containing the data in the appropriate
 * format for rendering a list of the top scores by chosen field value.
 */
import rison from 'rison-node';
import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import stringUtils from'plugins/prelert/util/string_utils';
import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlTopScoresTableController', function($scope, $route, $window, $location, timefilter) {
  
  $scope.$watch('esResponse', function(resp) {

    if (!resp) {
      return;
    }

    // Process the aggregations in the ES response which provide the data for the table.
    $scope.processAggregations(resp.aggregations);

  });

  $scope.processAggregations = function(aggregations) {

    var dataByViewBy = [];

    if (aggregations) {
      // Retrieve the id of the configured viewBy aggregation.
      var viewByAgg = $scope.vis.aggs.bySchemaName['viewBy'][0];
      var viewByAggId = viewByAgg.id;
      var viewByAggFieldName = viewByAgg.fieldDisplayName();
      var isTimeField = (viewByAggFieldName === $scope.vis.indexPattern.timeFieldName);

      // Retrieve the 'value' metric aggregation.
      var valueAgg = $scope.vis.aggs.bySchemaName['value'][0];

      // Get the buckets of the top-level aggregation.
      var buckets = aggregations[viewByAggId].buckets;

      // Get the labels for the metric aggregation, used in the tooltip.
      var scoreMetricLabel = valueAgg.makeLabel();

      var compiledTooltip = _.template('<div class="prl-top-scores-table-tooltip"><%= fieldName %>: <%= fieldValue %>'
              + '<hr/><%= scoreMetricLabel %>: <%= scoreText %></div>');

      _.each(buckets, function(bucket) {
        var valuesForViewBy = {};

        var fieldValue = bucket.key;
        if (isTimeField) {
          fieldValue = moment(fieldValue).format('MMM Do YYYY, HH:mm')
        }

        var scorePrecise = valueAgg.getValue(bucket);
        var score = parseInt(scorePrecise);
        var barScore = score != 0 ? score : 1;
        var scoreText = score != 0 ? score : '< 1';
        var severity = (score >= 3 ? anomalyUtils.getSeverity(score) : 'low_warning');

        var valuesForViewBy = {
          'fieldName' : viewByAggFieldName,
          'fieldValue' : fieldValue,
          'scorePrecise' : scorePrecise,
          'barScore' : barScore,
          'scoreText' : scoreText,
          'severity' : severity,
          'tooltip' : compiledTooltip({
            'fieldName' : viewByAggFieldName,
            'fieldValue' : fieldValue,
            'scoreMetricLabel' : scoreMetricLabel,
            'scoreText' : scoreText
          })
        };
        dataByViewBy.push(valuesForViewBy);

      });
      console.log("Top scores table, processAggregations() data:",dataByViewBy);

    }

    $scope.metricsData = dataByViewBy;

  };

  $scope.openExplorer = function(item) {

    // Open the Explorer dashboard to show results for the specified field name and value,
    // passing query and time range.

    // Get the time bounds set in the dashboard.
    var bounds = timefilter.getActiveBounds();
    var fromMoment = bounds.min;
    var toMoment = bounds.max;

    var isTimeField = (item.fieldName === $scope.vis.indexPattern.timeFieldName);
    if (isTimeField) {
      // Drill down to show 1 hour either side of clicked on time.
      fromMoment = moment(item.fieldValue, 'MMM Do YYYY, HH:mm').subtract(1, 'h');
      toMoment = moment(item.fieldValue, 'MMM Do YYYY, HH:mm').add(1, 'h');
    }

    var from = fromMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
    var to = toMoment.toISOString();

    // Build the query to pass to the Explorer dashboard.

    // If clicking on the influencer types swimlane, we want to drill down to show all values
    // of that influencerFieldName. For bucketTime drill down to show all (*).
    var query = '*';
    if (item.fieldName === 'influencerFieldValue') {
      var escapedFieldValue = stringUtils.escapeForElasticsearchQuery(item.fieldValue);
      // the arguments list in the path is actually a rison string and needs to be escaped differently
      // use rison's url encoder because it escapes quote characters correctly
      query = rison.encode_uri(escapedFieldValue);
    }

    var dash = $route.current.locals.dash;
    if (dash) {
      // If used inside a dashboard, 'AND' the drilldown condition onto the
      // dashboard-level query i.e. the string entered into the query bar.
      var dashboardFilters = dash.searchSource.get("filter");
      var queryBarFilter = _.find(dashboardFilters, function(filter){
        return filter.query && filter.query.query_string && !filter.meta;
      });

      if (queryBarFilter) {
        var queryString = _.get(queryBarFilter, 'query.query_string.query', '*');
        if (queryString !== '*') {
          var qs = rison.encode_uri(queryString);
          // remove extra single quote characters from around the rison string
          qs = qs.substr(1, qs.length-2);
          query = (query !== '*' ? (qs + " AND " + query) : qs);
        }
      }
    }

    var path = chrome.getBasePath() + "/app/prelert#/anomalyexplorer?_g=(refreshInterval:(display:Off,pause:!f,value:0)," +
    "time:(from:'" + from + "',mode:absolute,to:'" + to + "'))" +
    "&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:'" + query + "')))";

    // Pass the selected job(s) as search parameters in the URL.
    var selectedJobIds = [];
    if (item.fieldName === 'jobId') {
      selectedJobIds.push(item.fieldValue);
    } else {
      if (_.has($location.search(), 'jobId')) {
        var jobIdParam = $location.search().jobId;
        if (_.isArray(jobIdParam) == true) {
          selectedJobIds = jobIdParam;
        } else {
          selectedJobIds = [jobIdParam];
        }
      }
    }
    _.each(selectedJobIds, function(jobId) {
      path += "&jobId=";
      path += jobId;
    });

    // If clicking on an item with warning severity, pass a minimum severity parameter in the URL,
    // as components in the Explorer dashboard may default to only show minor and above.
    // Note that you can get influencers with scores >= 25 which only have warning level records.
    // TODO - add extra 'info' severity threshold in Anomaly Summary table, and always drill down to that level.
    if (item.scorePrecise < 25) {
      path += "&minSeverity=warning";
    }

    $window.open(path, '_blank');

  };

});
