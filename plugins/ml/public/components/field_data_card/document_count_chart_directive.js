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
 * AngularJS directive for rendering a chart showing
 * document count on the field data card.
 */

import _ from 'lodash';
import d3 from 'd3';
import moment from 'moment';

import 'plugins/ml/services/results_service';
import { numTicksForDateFormat } from 'plugins/ml/util/chart_utils';
import { calculateTextWidth } from 'plugins/ml/util/string_utils';
import { IntervalHelperProvider } from 'plugins/ml/util/ml_time_buckets';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlDocumentCountChart', function (
  timefilter,
  Private,
  mlResultsService) {

  function link(scope, element, attrs) {
    scope.isLoading = false;
    const svgWidth = attrs.width ? +attrs.width : 400;
    const svgHeight = scope.height = attrs.height ? +attrs.height : 400;

    const margin = { top: 0, right: 5, bottom: 20, left: 15 };

    let chartWidth = svgWidth - (margin.left + margin.right);
    const chartHeight = svgHeight - (margin.top + margin.bottom);

    let xScale = null;
    let yScale = d3.scale.linear().range([chartHeight, 0]);
    let xAxisTickFormat = 'YYYY-MM-DD HH:mm';

    let barChartGroup;

    const TARGET_BAR_WIDTH = 5;  // Target bar width, in pixels.
    const MlTimeBuckets = Private(IntervalHelperProvider);
    let chartAggInterval = null;

    element.on('$destroy', function () {
      scope.$destroy();
    });

    scope.$on('renderChart', () => {
      loadDocCountData();
    });

    function loadDocCountData() {
      // Show the chart loading indicator.
      scope.isLoading = true;

      // Calculate the aggregation interval to use for the chart.
      const barTarget = chartWidth / TARGET_BAR_WIDTH;
      // Use a maxBars of 10% greater than the target.
      const maxBars = Math.floor(1.1 * barTarget);
      const buckets = new MlTimeBuckets();
      const bounds = timefilter.getActiveBounds();
      buckets.setInterval('auto');
      buckets.setBounds(bounds);
      buckets.setBarTarget(Math.floor(barTarget));
      buckets.setMaxBars(maxBars);
      chartAggInterval = buckets.getInterval();
      xAxisTickFormat = buckets.getScaledDateFormat();

      // Load the event rate data.
      mlResultsService.getEventRateData(
        scope.indexPattern.title,
        scope.query,
        scope.indexPattern.timeFieldName,
        bounds.min.valueOf(),
        bounds.max.valueOf(),
        chartAggInterval.expression)
      .then((resp) => {
        scope.chartData = processChartData(resp.results);
        scope.isLoading = false;
        render();
      }).catch((resp) => {
        console.log('Document count chart - error building document count chart:', resp);
      });
    }

    function processChartData(docCountByTime) {
      // Return dataset in format used by the d3 chart i.e. array
      // of Objects with keys time (epoch ms), date (JavaScript date) and value.
      const chartData = [];
      _.each(docCountByTime, (value, time) => {
        chartData.push({
          date: new Date(+time),
          time: +time,
          value
        });
      });
      return chartData;
    }

    function render() {
      // Clear any existing elements from the visualization,
      // then build the svg elements for the bar chart.
      const chartElement = d3.select(element.get(0)).select('.content-wrapper');
      chartElement.selectAll('*').remove();

      if (scope.chartData === undefined) {
        return;
      }

      const svg = chartElement.append('svg')
        .attr('width',  svgWidth)
        .attr('height', svgHeight);

      // Set the size of the left margin according to the width
      // of the largest y axis tick label.
      const maxYVal = d3.max(scope.chartData, (d) => d.value);
      yScale = yScale.domain([0, maxYVal]);

      const yAxis = d3.svg.axis().scale(yScale).orient('left').outerTickSize(0);

      // barChartGroup translate doesn't seem to be relative
      // to parent svg, so have to add an extra 5px on.
      const maxYAxisLabelWidth = calculateTextWidth(maxYVal, true, svg);
      margin.left = Math.max(maxYAxisLabelWidth + yAxis.tickPadding() + 5, 25);
      chartWidth  = Math.max(svgWidth  - margin.left - margin.right, 0);

      const bounds = timefilter.getActiveBounds();
      xScale = d3.time.scale()
        .domain([new Date(bounds.min.valueOf()), new Date(bounds.max.valueOf())])
        .range([0, chartWidth]);

      const xAxis = d3.svg.axis().scale(xScale).orient('bottom')
        .outerTickSize(0).ticks(numTicksForDateFormat(chartWidth, xAxisTickFormat))
        .tickFormat((d) => {
          return moment(d).format(xAxisTickFormat);
        });

      barChartGroup = svg.append('g')
        .attr('class', 'bar-chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      drawBarChartAxes(xAxis, yAxis);
      drawBarChartPaths();
    }

    function drawBarChartAxes(xAxis, yAxis)  {
      const axes = barChartGroup.append('g');

      axes.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis);

      axes.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    }

    function drawBarChartPaths() {
      const data = scope.chartData;
      let cellWidth = 0;
      if (data.length > 0) {
        cellWidth = xScale(data[0].time + chartAggInterval.asMilliseconds()) - xScale(data[0].time);
      }

      barChartGroup.selectAll('bar')
        .data(data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => { return xScale(d.time); })
        .attr('width', cellWidth)
        .attr('y', (d) => { return yScale(d.value); })
        .attr('height', (d) => { return chartHeight - yScale(d.value); });
    }

    // Do the initial load.
    loadDocCountData();

  }

  return {
    scope: {
      indexPattern: '=',
      query: '=',
      earliest: '=',
      latest: '=',
      chartConfig: '='
    },
    link: link,
    template: require('plugins/ml/components/loading_indicator/loading_indicator_wrapper.html')
  };
});
