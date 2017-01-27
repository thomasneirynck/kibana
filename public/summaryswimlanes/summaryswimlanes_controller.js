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
 * Angular controller for the Ml summary swimlane visualization, which builds the
 * two swimlane charts showing maximum anomaly score by job and influencer type, from
 * the aggregation data received from Elasticsearch.
 */
import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';
import moment from 'moment';

require('../lib/bower_components/flot/jquery.flot');
require('../lib/bower_components/flot/jquery.flot.selection');
require('../lib/bower_components/flot/jquery.flot.time');
require('../lib/bower_components/flot/jquery.flot.resize');

import chrome from 'ui/chrome';
import 'ui/courier';
import 'ui/timefilter';

import stringUtils from 'plugins/ml/util/string_utils';
import 'plugins/ml/services/job_service';
import 'plugins/ml/services/ml_dashboard_service';
import 'plugins/ml/services/results_service';
import 'plugins/ml/swimlane/swimlane_influencers/swimlane_influencers_directive';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.controller('MlSummarySwimlanesController', function (
  $scope,
  $route,
  $window,
  $location,
  courier,
  mlJobService,
  mlDashboardService,
  mlResultsService) {

  $scope.jobData = {};
  $scope.influencerTypeData = {};
  $scope.hasSwimlaneData = false;

  // Obtain the descriptions for each job.
  $scope.jobDescriptions = {};
  mlJobService.getBasicJobInfo($scope.vis.indexPattern.id)
  .then(function (resp) {
    if (resp.jobs.length > 0) {
      const descriptions = {};
      const detectorsByJob = {};
      _.each(resp.jobs, function (job) {
        descriptions[job.id] = job.description;
      });
      $scope.jobDescriptions = descriptions;
    }
  }).catch(function (resp) {
    console.log('Summary Swimlanes - error getting job info from ES:', resp);
  });


  $scope.$watch('esResponse', function (resp) {

    if (!resp) {
      $scope._previousHoverPoint = null;
      return;
    }

    if (resp.hits.total !== 0) {
      // Remove ng-hide from the parent div as that has display:none, which can
      // result in the flot chart labels falling inside the chart area on first render
      // and x-axis labels not being laid out correctly.
      $('.ml-summary-swimlanes').closest('.ng-hide').removeClass('ng-hide');
    }

    console.log('Summary Swimlanes esResponse:', resp);

    // Process the aggregations in the ES response.
    $scope.processAggregations(resp.aggregations);

    syncViewControls();

    // Tell the swimlane directive to render.
    $scope.$broadcast('render');

  });

  $scope.$on('swimlaneClick', function (event, data) {
    // Open the Explorer dashboard to show results for the job or influencer type clicked on,
    // passing query and time range.

    // Add hour either side of time span if duration < 1 day.
    const fromMoment = moment(data.time);
    const toMoment = moment(data.time).add(data.durationMs, 'ms');
    if (data.durationMs < 86400000) {
      fromMoment.subtract(1, 'h');
      toMoment.add(1, 'h');
    }
    const from = fromMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
    const to = toMoment.toISOString();

    // Build the query to pass to the Explorer dashboard.

    // If clicking on the influencer types swimlane, we want to drill down to show all values
    // of that influencerFieldName. For bucket_time drill down to show all (*).
    let query = '*';
    if (data.mode === 'influencerTypes' && data.value !== 'bucket_time') {
      query = encodeURIComponent(data.value) + ':*';
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
          query = (query !== '*' ? (encodeURIComponent(queryString) + ' AND ' + query) : encodeURIComponent(queryString));
        }
      }
    }

    let path = chrome.getBasePath() + '/app/ml#/anomalyexplorer?_g=(refreshInterval:(display:Off,pause:!f,value:0),' +
      'time:(from:\'' + from + '\',mode:absolute,to:\'' + to + '\'))' +
      '&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'' + query + '\')))';

    // Pass the selected job(s) as search parameters in the URL.
    let selectedJobIds = [];
    if (data.mode === 'jobs') {
      selectedJobIds.push(data.value);
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

    // If clicking on a bar with warning severity, pass a minimum severity parameter in the URL,
    // as components in the Explorer dashboard may default to only show minor and above.
    if (data.score < 25) {
      path += '&minSeverity=warning';
    }

    $window.open(path, '_blank');
  });


  $scope.processAggregations = function (aggregations) {
    // Need to build two data sets:
    // 1. metric (max anomalyScore) by job by time.
    // 2. metric (max anomalyScore) by influencertype by time.

    const dataByJob = {};
    const dataByInfluencerType = {};

    if (aggregations) {
      // Retrieve the visualization aggregations.
      const metricsAgg = $scope.vis.aggs.bySchemaName.metric[0];
      const jobAgg = $scope.vis.aggs.bySchemaName.viewBy[0];
      const influencerTypeAgg = $scope.vis.aggs.bySchemaName.secondaryViewBy[0];
      const timeAgg = $scope.vis.aggs.bySchemaName.timeSplit[0];
      const timeAggId = timeAgg.id;

      // Go down an extra level to the buckets of the secondary viewBy aggregation.
      const influencerTypeAggId = influencerTypeAgg.id;

      // For jobs, the max anomaly score is the max score across the influencers.
      const buckets = aggregations[jobAgg.id].buckets;
      _.each(buckets, function (bucket) {
        const jobId = bucket.key;
        const timesForJob = {};

        dataByJob[jobId] = timesForJob;

        const bucketsForViewByValue = bucket[influencerTypeAggId].buckets;
        _.each(bucketsForViewByValue, function (secondaryBucket) {
          const influencerType = secondaryBucket.key;

          let timesForInfluencerType;
          if (_.has(dataByInfluencerType, influencerType)) {
            timesForInfluencerType = dataByInfluencerType[influencerType];
          } else {
            timesForInfluencerType = {};
            dataByInfluencerType[influencerType] = timesForInfluencerType;
          }

          // At the bucketInfluencer level, should be 1 record per time per influencer type.
          // Bucket score for job at this time will be the max of these.
          const bucketsForInfluencerType = secondaryBucket[timeAggId].buckets;
          _.each(bucketsForInfluencerType, function (valueBucket) {
            const bucketTime = valueBucket.key;
            const bucketValue = metricsAgg.getValue(valueBucket);
            const existingJobValue = _.has(timesForJob, bucketTime) ? timesForJob[bucketTime].value : 0;
            const existingInfluencerValue = _.has(timesForInfluencerType, bucketTime) ? timesForInfluencerType[bucketTime].value : 0;
            timesForJob[bucketTime] = { value: Math.max(bucketValue, existingJobValue) };
            timesForInfluencerType[bucketTime] = { value: Math.max(bucketValue, existingInfluencerValue) };
          });

        });
      });

      console.log('Summary Swimlanes, processAggregations() dataByJob:', dataByJob, dataByJob);
      console.log('Summary Swimlanes, processAggregations() dataByInfluencerType:', dataByInfluencerType);
    }

    $scope.jobData = dataByJob;
    $scope.influencerTypeData = dataByInfluencerType;
    $scope.hasSwimlaneData = (_.keys($scope.jobData).length > 0);
  };

  function syncViewControls() {
    // Synchronize the Interval control to match the time aggregation run in the view,
    // e.g. if the interval is being edited via the Kibana Visualization tab sidebar

    if ($scope.vis.aggs.length === 0) {
      return;
    }

    // Retrieve the visualization aggregations.
    const timeAgg = $scope.vis.aggs.bySchemaName.timeSplit[0];

    // Update the scope 'interval' field.
    let aggInterval = _.get(timeAgg, ['params', 'interval', 'val']);
    if (aggInterval === 'custom') {
      aggInterval = _.get(timeAgg, ['params', 'customInterval']);
    }

    let scopeInterval = $scope.vis.params.interval.val;
    if (scopeInterval && scopeInterval === 'custom') {
      scopeInterval = $scope.vis.params.interval.customInterval;
    }

    let setToInterval = _.findWhere($scope.vis.type.params.intervalOptions, {val: aggInterval});
    if (!setToInterval) {
      setToInterval = _.findWhere($scope.vis.type.params.intervalOptions, {customInterval: aggInterval});
    }
    if (!setToInterval) {
      // e.g. if running inside the Kibana Visualization tab will need to add an extra option in.
      setToInterval = {};

      if (_.get(timeAgg, ['params', 'interval', 'val']) !== 'custom') {
        setToInterval.val = _.get(timeAgg, ['params', 'interval', 'val']);
        setToInterval.display = 'Custom: ' + _.get(timeAgg, ['params', 'interval', 'val']);
      } else {
        setToInterval.val = 'custom';
        setToInterval.customInterval = _.get(timeAgg, ['params', 'customInterval']);
        setToInterval.display = 'Custom: ' + _.get(timeAgg, ['params', 'customInterval']);
      }

      $scope.vis.type.params.intervalOptions.push(setToInterval);
    }


    // Set the flags which indicate if the interval has been scaled.
    // e.g. if requesting points at 5 min interval would result in too many buckets being returned.
    const timeBucketsInterval = timeAgg.buckets.getInterval();
    setToInterval.scaled = timeBucketsInterval.scaled;
    setToInterval.scale = timeBucketsInterval.scale;
    setToInterval.description = timeBucketsInterval.description;

    $scope.vis.params.interval = setToInterval;
  }

  $scope.updateViewState = function () {
    // Set up the visualization in response to a change in the Interval control.
    setupVisualization()
    .then(function () {
      // Re-run the dashboard search.
      return courier.fetch();
    })
    .catch(function (error) {
      console.log('Error updating summary swimlane visualization with new view state.', error);
    });
  };

  function setupVisualization() {
    // Set the params of the bucket aggregations to the selected 'interval' field.
    // For example of setting state of visualization see setupVisualization() in discover.js.
    if ($scope.vis) {
      const visState = $scope.vis.getState();

      // Set the aggregation interval of the 'timeSplit' aggregation.
      const timeAgg = _.last(visState.aggs);
      timeAgg.params.interval = $scope.vis.params.interval.val;
      if ($scope.vis.params.interval.val === 'custom') {
        timeAgg.params.customInterval = $scope.vis.params.interval.customInterval;
      }

      $scope.vis.setState(visState);

      // Update the viewBy field name and time interval of the 'editable vis'
      // e.g. if visualization is being viewed in the Kibana Visualize view,
      // need to update the configurations for the aggregations in the editor sidebar.
      const editableVis = $scope.vis.getEditableVis();
      if (editableVis) {
        const editableVisState = editableVis.getState();

        const editableTimeAgg = _.last(editableVisState.aggs);
        editableTimeAgg.params.interval = $scope.vis.params.interval.val;
        if ($scope.vis.params.interval.val === 'custom') {
          editableTimeAgg.params.customInterval = $scope.vis.params.interval.customInterval;
        }

        editableVis.setState(editableVisState);
      }

      return Promise.resolve($scope.vis);
    }

  }

})
.directive('mlSummarySwimlane', function ($location, $compile, timefilter) {

  function link(scope, element, attrs) {

    scope._previousHoverPoint = null;
    scope._influencerHoverScope = null;
    scope.mode = attrs.mode;         // jobs or influencerTypes

    scope.$on('render',function (event, d) {
      renderSwimlane();
    });

    function renderSwimlane() {

      let chartData = [];
      if (scope.mode === 'jobs') {
        chartData = scope.jobData || [];
      } else {
        chartData = scope.influencerTypeData || [];
      }

      const allSeries = [];

      // Create a series for each severity color band, with a 'low warning' level for scores < 3.
      const colorBands = ['#d2e9f7', '#8bc8fb', '#ffdd00', '#ff7e00', '#fe5050'];
      const seriesLabels = ['low_warning','warning','minor','major','critical'];
      _.each(colorBands, function (color, i) {
        const series = {};
        series.label = seriesLabels[i];
        series.color = color;
        series.points = { fillColor: color, show: true, radius: 5, symbol: drawChartSymbol,  lineWidth: 1 };
        series.data = [];
        series.shadowSize = 0;
        allSeries.push(series);
      });

      // Sort the chart data keys so that the lane labels are in order a-z from the top.
      chartData = sortChartData(chartData);
      const laneIds = _.keys(chartData);

      let laneIndex = 0;
      _.each(chartData, function (bucketsForViewByValue, viewByValue) {

        laneIndex = laneIds.indexOf(viewByValue);

        _.each(bucketsForViewByValue, function (dataForTime, time) {
          const value = dataForTime.value;

          // Map value to the index of the series for that severity.
          // Use the usual four colour bands for values between 0 and 100,
          // plus an additional 'low warning' series for scores < 3.
          let seriesIndex = value < 3 ? 0 : (Math.floor(parseInt(value) / 25) + 1);
          seriesIndex = seriesIndex > 4 ? 4 : seriesIndex;

          const pointData = new Array();
          pointData[0] = moment(Number(time));
          pointData[1] = laneIndex + 0.5;
          // Store the score in an additional object property for each point.
          pointData[2] = {score: value};

          allSeries[seriesIndex].data.push(pointData);

        });
      });

      // Extract the bounds of the time filter so we can set the x-axis min and max.
      // If no min/max supplied, Flot will automatically set them according to the data values.
      const bounds = timefilter.getActiveBounds();
      let earliest = null;
      let latest = null;
      if (bounds) {
        const timeAgg = scope.vis.aggs.bySchemaName.timeSplit[0];
        const aggInterval = timeAgg.buckets.getInterval();

        // Elasticsearch aggregation returns points at start of bucket,
        // so set the x-axis min to the start of the aggregation interval.
        earliest = moment(bounds.min).startOf(aggInterval.description).valueOf();
        latest = moment(bounds.max).valueOf();
      }

      const options = {
        xaxis: {
          mode: 'time',
          timeformat: '%d %b %H:%M',
          tickFormatter: function (v, axis) {
            // TODO - check if Kibana has functionality for displaying times in browser or UTC timezone.
            // moment.format() will use browser timezone.
            // Only show time if tick spacing is less than a day.
            const tickGap = (axis.max - axis.min) / 10000;  // Approx 10 ticks, convert to sec.
            if (tickGap < 86400) {
              return moment(v).format('MMM D HH:mm');
            } else {
              return moment(v).format('MMM D YYYY');
            }
          },
          min: _.isUndefined(earliest) ? null : earliest,
          max: _.isUndefined(latest) ? null : latest,
          color: '#d5d5d5',
          position: 'bottom'
        },
        yaxis: {
          min: 0,
          color: null,
          tickColor: null,
          tickLength: 0,
        },
        grid: {
          backgroundColor: null,
          borderWidth: 1,
          hoverable: true,
          clickable: true,
          borderColor: '#cccccc',
          color: null,
        },
        legend : {
          show: false
        },
        selection: {
          mode: 'x',
          color: '#bbbbbb'
        }
      };

      // Set the alternate lane marking color depending on whether Kibana dark theme is being used.
      // Note we currently don't respond to the 'Use dark theme' Options toggle, only on refresh.
      const alternateLaneColor = element.closest('.theme-dark').length === 0 ? '#f5f5f5' : '#4a4a4a';

      options.yaxis.max = laneIds.length;
      options.yaxis.ticks = [];
      options.grid.markings = [];

      let yaxisMarking;
      _.each(laneIds, function (labelId, i) {
        // Get the label of the 'viewBy' field corresponding to the field ID.
        // For the job swimlane, map job ID to job description
        let labelText = '';
        if (scope.mode === 'jobs') {
          labelText = scope.jobDescriptions[labelId];
        } else {
          labelText = (labelId === 'bucket_time' ? 'Overall' : labelId);
        }

        // Crop y-axis 'viewBy' labels over 30 chars of more.
        labelText = (labelText.length < 28 ? labelText : labelText.substring(0, 25) + '...');
        const tick = [i + 0.5, labelText];
        options.yaxis.ticks.push(tick);

        // Set up marking effects for each lane.
        if (i > 0) {
          yaxisMarking = {};
          yaxisMarking.from = i;
          yaxisMarking.to = i + 0.03;
          const marking = {yaxis: yaxisMarking, color: '#d5d5d5'};
          options.grid.markings.push(marking);
        }

        if (i % 2 !== 0) {
          yaxisMarking = {};
          yaxisMarking.from = i + 0.03;
          yaxisMarking.to = i + 1;
          const marking = {yaxis: yaxisMarking, color: alternateLaneColor};
          options.grid.markings.push(marking);
        }
      });

      // Adjust height of element according to the number of lanes, allow
      // for height of axis labels.
      // TODO - use CSS properties, rather than hardcoded numbers.

      // Draw the plot.
      element.height((laneIds.length * 32) + 50);
      const plot = $.plot(element, allSeries, options);


      // Add tooltips to the y-axis labels to display the full 'viewBy' field
      // - useful for cases where a long text value has been cropped.
      // NB. requires z-index set in CSS so that hover is picked up on label.
      const yAxisLabelDivs = $('.flot-y-axis', angular.element(element)).find('.flot-tick-label');
      _.each(laneIds, function (labelId, i) {
        let labelText = '';
        if (scope.mode === 'jobs') {
          labelText = scope.jobDescriptions[labelId];
        } else {
          labelText = (labelId === 'bucket_time' ? 'Overall' : labelId);
        }
        $(yAxisLabelDivs[i]).attr('title', labelText);
      });

      // Trigger swimlaneClick events to drill down to the Explorer dashboard.
      element.unbind('plotclick');
      element.bind('plotclick', function (event, pos, item) {
        plot.unhighlight();

        if (item) {
          // Trigger a click event, passing on the point time span and lane field/value.
          if (!plot.getSelection()) {
            const timeAgg = scope.vis.aggs.bySchemaName.timeSplit[0];
            const bucketInterval = timeAgg.buckets.getInterval();  // A moment duration.
            const laneIndex = item.datapoint[1] - 0.5;
            const fieldValue = laneIds[laneIndex];
            const dataModel = item.series.data[item.dataIndex][2];

            const clickData = {'time':item.datapoint[0],
                'durationMs':bucketInterval.asMilliseconds(),
                'mode': scope.mode,
                'value': fieldValue,
                'severity': item.series.label,
                'score': dataModel.score};

            plot.highlight(item.series, item.datapoint);
            scope.$emit('swimlaneClick', clickData);
          }
        }
      });

      // Set the timefilter if the user selects a range on the chart.
      element.unbind('plotselected');
      element.bind('plotselected', function (event, ranges) {
        let zoomFrom = ranges.xaxis.from;
        let zoomTo = ranges.xaxis.to;

        // Aggregation returns points at start of bucket, so make sure the time
        // range zoomed in to covers the full aggregation interval.
        const timeAgg = scope.vis.aggs.bySchemaName.timeSplit[0];
        const aggIntervalMs = timeAgg.buckets.getInterval().asMilliseconds();

        // Add a bit of extra padding before start time.
        zoomFrom = zoomFrom - (aggIntervalMs / 4);
        zoomTo = zoomTo + aggIntervalMs;

        timefilter.time.from = moment.utc(zoomFrom);
        timefilter.time.to = moment.utc(zoomTo);
        timefilter.time.mode = 'absolute';
      });


      // Show tooltips on point hover.
      element.unbind('plothover');
      element.bind('plothover', function (event, pos, item) {
        if (item) {
          element.addClass('swimlane-point-over');
          if (scope._previousHoverPoint !== item.dataIndex) {
            scope._previousHoverPoint = item.dataIndex;
            $('.ml-swimlane-tooltip').remove();
            if (scope._influencerHoverScope) {
              scope._influencerHoverScope.$destroy();
            }

            const laneIndex = item.series.data[item.dataIndex][1] - 0.5;
            const laneLabel = laneIds[laneIndex];
            showTooltip(item, laneLabel);
          }
        } else {
          element.removeClass('swimlane-point-over');
          $('.ml-swimlane-tooltip').remove();
          scope._previousHoverPoint = null;
          if (scope._influencerHoverScope) {
            scope._influencerHoverScope.$destroy();
          }
        }
      });
    }

    function sortChartData(chartData) {
      let keys = _.sortBy(_.keys(chartData), function (key) {
        return key;
      });

      // Sort the lane labels in reverse so that the order is a-z from the top.
      keys = keys.reverse();

      // For influencer types, put the 'bucket_time' lane at the top.
      if (scope.mode === 'influencerTypes') {
        keys = _.without(keys, 'bucket_time');
        keys.push('bucket_time');
      }

      return _.object(keys, _.map(keys, function (key) {
        return chartData[key];
      }));
    }

    function drawChartSymbol(ctx, x, y, radius, shadow) {
      const size = radius * Math.sqrt(Math.PI) / 2;
      ctx.rect(x - size, y - 14, size + size, 28);
    }

    function showTooltip(item, laneLabel) {
      const pointTime = item.datapoint[0];
      const dataModel = item.series.data[item.dataIndex][2];
      const score = parseInt(dataModel.score);
      const metricsAgg = scope.vis.aggs.bySchemaName.metric[0];
      const metricLabel = metricsAgg.makeLabel();
      const displayScore = (score > 0 ? score : '< 1');

      // TODO - check if Kibana has functionality for displaying times in browser or UTC timezone.
      // Refer to GitHub ticket - https://github.com/elastic/kibana/issues/1600, currently unresolved.
      // Display date using same format as Kibana visualizations.
      const formattedDate = moment(pointTime).format('MMMM Do YYYY, HH:mm');
      let contents = formattedDate + '<br/><hr/>';

      if (scope.mode === 'jobs') {
        // Additionally display job ID.
        contents += ('Job ID: ' + laneLabel + '<br/>');
      }

      contents += (metricLabel + ': ' + displayScore);

      const x = item.pageX;
      const y = item.pageY;
      const offset = 5;
      const $mlSwimlaneTooltip = $('<div class="ml-swimlane-tooltip">' + contents + '</div>').css({
        'position': 'absolute',
        'display': 'none',
        'z-index': 1,
        'top': y + offset,
        'left': x + offset
      }).appendTo('body').fadeIn(200);


      if (scope.mode === 'influencerTypes' && laneLabel !== 'bucket_time') {
        // Display top influencer field values in the tooltip
        // using the ml-swimlane-influencers directive.

        // Store the attributes required for querying elasticsearch in the child scope.
        const timeAgg = scope.vis.aggs.bySchemaName.timeSplit[0];
        const bucketInterval = timeAgg.buckets.getInterval();
        const latestMs = pointTime + bucketInterval.asMilliseconds() - 1;

        scope._influencerHoverScope = scope.$new();
        scope._influencerHoverScope.indexPattern = scope.vis.indexPattern;
        scope._influencerHoverScope.influencerFieldName = laneLabel;
        scope._influencerHoverScope.earliestMs = pointTime;
        scope._influencerHoverScope.latestMs = latestMs;
        scope._influencerHoverScope.itemPageX = x;
        scope._influencerHoverScope.itemPageY = y;

        // Add the list of selected jobs to the child scope.
        if (_.has($location.search(), 'jobId')) {
          const jobIdParam = $location.search().jobId;
          if (_.isArray(jobIdParam) === true) {
            scope._influencerHoverScope.selectedJobIds = jobIdParam;
          } else {
            if (jobIdParam !== '*') {
              scope._influencerHoverScope.selectedJobIds = [jobIdParam];
            }
          }
        }

        // Compile the contents to link the ml-swimlane-influencers directive to the child scope.
        const $topInfluencersContent = $('<br/><hr/><ml-swimlane-influencers/>');
        $mlSwimlaneTooltip.addClass('influencers-mode');
        $mlSwimlaneTooltip.append($topInfluencersContent);
        $compile($mlSwimlaneTooltip)(scope._influencerHoverScope);
      }

      // Position the tooltip.
      const $win = $(window);
      const winHeight = $win.height();
      const yOffset = window.pageYOffset;
      const width = $mlSwimlaneTooltip.outerWidth(true);
      const height = $mlSwimlaneTooltip.outerHeight(true);

      $mlSwimlaneTooltip.css('left', x + offset + width > $win.width() ? x - offset - width : x + offset);
      $mlSwimlaneTooltip.css('top', y + height < winHeight + yOffset ? y : y - height);

    }
  }

  return {
    link: link,
    scope: true
  };
});