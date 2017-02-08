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
 * Angular controller for the Ml top scores table.
 * The controller processes the aggregation received from Elasticsearch,
 * placing a metricsData object in scope containing the data in the appropriate
 * format for rendering a list of the top scores by chosen field value.
 */
import rison from 'rison-node';
import _ from 'lodash';
import moment from 'moment';

import anomalyUtils from 'plugins/ml/util/anomaly_utils';
import stringUtils from'plugins/ml/util/string_utils';
import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlTopScoresTableController', function ($scope, $route, $window, $location, timefilter) {

  $scope.$watch('esResponse', function (resp) {

    if (!resp) {
      return;
    }

    // Process the aggregations in the ES response which provide the data for the table.
    $scope.processAggregations(resp.aggregations);

  });

  $scope.processAggregations = function (aggregations) {

    const dataByViewBy = [];

    if (aggregations) {
      // Retrieve the id of the configured viewBy aggregation.
      const viewByAgg = $scope.vis.aggs.bySchemaName.viewBy[0];
      const viewByAggId = viewByAgg.id;
      const viewByAggFieldName = viewByAgg.getFieldDisplayName();
      const isTimeField = (viewByAggFieldName === $scope.vis.indexPattern.timeFieldName);

      // Retrieve the 'value' metric aggregation.
      const valueAgg = $scope.vis.aggs.bySchemaName.value[0];

      // Get the buckets of the top-level aggregation.
      const buckets = aggregations[viewByAggId].buckets;

      // Get the labels for the metric aggregation, used in the tooltip.
      const scoreMetricLabel = valueAgg.makeLabel();

      const compiledTooltip = _.template('<div class="ml-top-scores-table-tooltip"><%= fieldName %>: <%= fieldValue %>'
              + '<hr/><%= scoreMetricLabel %>: <%= scoreText %></div>');

      _.each(buckets, function (bucket) {
        let fieldValue = bucket.key;
        if (isTimeField) {
          fieldValue = moment(fieldValue).format('MMM Do YYYY, HH:mm');
        }

        const scorePrecise = valueAgg.getValue(bucket);
        const score = parseInt(scorePrecise);
        const barScore = score !== 0 ? score : 1;
        const scoreText = score !== 0 ? score : '< 1';
        const severity = (score >= 3 ? anomalyUtils.getSeverity(score) : 'low_warning');

        const valuesForViewBy = {
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
      console.log('Top scores table, processAggregations() data:',dataByViewBy);

    }

    $scope.metricsData = dataByViewBy;

  };

  $scope.openExplorer = function (item) {

    // Open the Explorer dashboard to show results for the specified field name and value,
    // passing query and time range.

    // Get the time bounds set in the dashboard.
    const bounds = timefilter.getActiveBounds();
    let fromMoment = bounds.min;
    let toMoment = bounds.max;

    const isTimeField = (item.fieldName === $scope.vis.indexPattern.timeFieldName);
    if (isTimeField) {
      // Drill down to show 1 hour either side of clicked on time.
      fromMoment = moment(item.fieldValue, 'MMM Do YYYY, HH:mm').subtract(1, 'h');
      toMoment = moment(item.fieldValue, 'MMM Do YYYY, HH:mm').add(1, 'h');
    }

    const from = fromMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
    const to = toMoment.toISOString();

    // Build the query to pass to the Explorer dashboard.

    // If clicking on the influencer types swimlane, we want to drill down to show all values
    // of that influencer_field_name. For bucketTime drill down to show all (*).
    let query = '*';
    if (item.fieldName === 'influencer_field_value') {
      const escapedFieldValue = stringUtils.escapeForElasticsearchQuery(item.fieldValue);
      // the arguments list in the path is actually a rison string and needs to be escaped differently
      // use rison's url encoder because it escapes quote characters correctly
      query = rison.encode_uri(escapedFieldValue);

      // remove extra single quote characters from around the rison string
      // note these may not be present depending on the String that has been encoded.
      if (query.charAt(0) === '\'' && query.charAt(query.length - 1) === '\'') {
        query = query.substr(1, query.length - 2);
      }
    }

    const dash = $route.current.locals.dash;
    if (dash) {
      // If used inside a dashboard, 'AND' the drilldown condition onto the
      // dashboard-level query i.e. the string entered into the query bar.
      const dashboardFilters = dash.searchSource.get('filter');
      const queryBarFilter = _.find(dashboardFilters, function (filter) {
        return filter.query && filter.query.query_string && !filter.meta;
      });

      if (queryBarFilter) {
        const queryString = _.get(queryBarFilter, 'query.query_string.query', '*');
        if (queryString !== '*') {
          let qs = rison.encode_uri(queryString);
          // remove extra single quote characters from around the rison string
          // note these may not be present depending on the String that has been encoded.
          qs = qs.substr(1, qs.length - 2);
          query = (query !== '*' ? (qs + ' AND ' + query) : qs);
        }
      }
    }

    let path = chrome.getBasePath() + '/app/ml#/anomalyexplorer?_g=(refreshInterval:(display:Off,pause:!f,value:0),' +
      'time:(from:\'' + from + '\',mode:absolute,to:\'' + to + '\'))' +
      '&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'' + query + '\')))';

    // Pass the selected job(s) as search parameters in the URL.
    let selectedJobIds = [];
    if (item.fieldName === 'jobId') {
      selectedJobIds.push(item.fieldValue);
    } else {
      if (_.has($location.search(), 'jobId')) {
        const jobIdParam = $location.search().jobId;
        if (_.isArray(jobIdParam) === true) {
          selectedJobIds = jobIdParam;
        } else {
          selectedJobIds = [jobIdParam];
        }
      }
    }
    _.each(selectedJobIds, function (jobId) {
      path += '&jobId=';
      path += jobId;
    });

    // If clicking on an item with warning severity, pass a minimum severity parameter in the URL,
    // as components in the Explorer dashboard may default to only show minor and above.
    // Note that you can get influencers with scores >= 25 which only have warning level records.
    // TODO - add extra 'info' severity threshold in Anomaly Summary table, and always drill down to that level.
    if (item.scorePrecise < 25) {
      path += '&minSeverity=warning';
    }

    $window.open(path, '_blank');

  };

});
