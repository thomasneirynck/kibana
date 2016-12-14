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
 * Chart showing model debug data, annotated with anomalies.
 */

import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import moment from 'moment';
import numeral from 'numeral';
import angular from 'angular';
import 'ui/timefilter';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlNewJobChart', function (timefilter, prlSimpleJobService) {

  function link(scope, element, attrs) {

    const svgWidth  = angular.element('.jobs-container').width();
    const lineChartHeight = 310;
    const contextHeight = 0;
    const swimlaneHeight = 30;
    const margin = { top: 0, right: 0, bottom: 40, left: 50 };
    const svgHeight = lineChartHeight + contextHeight + swimlaneHeight + margin.top + margin.bottom;
    const vizWidth  = svgWidth  - margin.left - margin.right;
    const chartLimits = {max: 0, min: 0};

    let lineChartXScale = d3.time.scale().range([0, vizWidth]);
    let lineChartYScale = d3.scale.linear().range([lineChartHeight, 0]);

    const lineChartXAxis = d3.svg.axis().scale(lineChartXScale).orient('bottom')
      .innerTickSize(-lineChartHeight).outerTickSize(0).tickPadding(10);
    const lineChartYAxis = d3.svg.axis().scale(lineChartYScale).orient('left')
      .innerTickSize(-vizWidth).outerTickSize(0).tickPadding(10);

    // TODO - do we want to use interpolate('basis') to smooth the connecting lines?
    const lineChartValuesLine = d3.svg.line()
      .x(d => lineChartXScale(d.date))
      .y(d => lineChartYScale(d.value));
    const lineChartBoundedArea = d3.svg.area()
      .x (d => lineChartXScale(d.date) || 0)
      .y0(d => lineChartYScale(Math.max(chartLimits.min, Math.min(chartLimits.max, d.upper))))
      .y1(d => lineChartYScale(Math.min(chartLimits.max, Math.max(chartLimits.min, d.lower))));

    let lineChartGroup;
    let modelChartGroup;
    let swimlaneGroup;
    let dotChartGroup;

    scope.$on('render', (event, d) => {
      createSVGGroups();
      drawLineChart();
    });

    scope.$on('render-results', (event, d) => {
      drawResults();
    });

    element.on('$destroy', () => {
      scope.$destroy();
    });


    function createSVGGroups() {
      if (scope.chartData.line === undefined) {
        return;
      }

      // console.log(' ', scope.chartData.line);

      // Clear any existing elements from the visualization,
      // then build the svg elements for the bubble chart.
      const chartElement = d3.select(element.get(0));
      chartElement.select('svg').remove();

      if (chartElement.select('.progress-bar')[0][0] === null) {
        const progress = chartElement.append('div')
          .attr('class', 'progress')
          .attr('style','width:' + (+vizWidth + 2) + 'px; margin-bottom: -' + (+lineChartHeight + 8) + 'px')
          .append('div')
          .attr('class', 'progress-bar');
      }

      const svg = chartElement.append('svg')
        .attr('width',  svgWidth)
        .attr('height', svgHeight);

      swimlaneGroup = svg.append('g')
        .attr('class', 'swimlane')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      modelChartGroup = svg.append('g')
        .attr('class', 'model-chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      lineChartGroup = svg.append('g')
        .attr('class', 'line-chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      dotChartGroup = svg.append('g')
        .attr('class', 'line-chart-markers')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    }

    function drawLineChart() {
      const data = scope.chartData.line;
      const model = scope.chartData.model;

      lineChartXScale = lineChartXScale.domain(d3.extent(data, d => d.date));

      chartLimits.max = d3.max(data, (d) => d.value);
      chartLimits.min = d3.min(data, (d) => d.value);

      // add padding of 10% of the difference between max and min
      // to the upper and lower ends of the y-axis
      const padding = (chartLimits.max - chartLimits.min) * 0.1;
      chartLimits.max += padding;
      chartLimits.min -= padding;

      lineChartYScale = lineChartYScale.domain([
        chartLimits.min,
        chartLimits.max
      ]);

      const xAxis = d3.svg.axis().scale(lineChartXScale).orient('bottom')
        .innerTickSize(-lineChartHeight).outerTickSize(0).tickPadding(10);
      const yAxis = d3.svg.axis().scale(lineChartYScale).orient('left')
        .innerTickSize(-vizWidth).outerTickSize(0).tickPadding(10);

      // Add border round plot area.
      const borderPath = lineChartGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', lineChartHeight)
        .attr('width', vizWidth)
        .style('stroke', '#cccccc')
        .style('fill', 'none')
        .style('stroke-width', 1);


      drawLineChartAxes(xAxis, yAxis);
      drawLineChartPaths(data, model);
    }

    function drawLineChartAxes(xAxis, yAxis) {

      const axes = lineChartGroup.append('g');

      axes.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + lineChartHeight + ')')
        .call(xAxis);

      axes.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    }

    function drawLineChartPaths(data, model) {
      lineChartGroup.append('path')
        .attr('class', 'values-line')
        .attr('d', lineChartValuesLine(data));
    }

    function drawResults() {
      const data = scope.chartData.line;
      const model = scope.chartData.model;


      drawModelPaths(model);
      if (scope.chartData.anomalyMode === 'dots') {
        drawAnomalyDots(data);
      } else {
        drawSwimlane(vizWidth, lineChartHeight);
      }
      updateProgressBar();
    }

    function drawModelPaths(model) {
      modelChartGroup.selectAll('*').remove();
      modelChartGroup.append('path')
        .attr('class', 'area bounds')
        .attr('d', lineChartBoundedArea(model));
    }

    function drawAnomalyDots(data) {
      // Render circle markers for the points.
      // These are used for displaying tooltips on mouseover.
      const dots = d3.select('.line-chart-markers').selectAll('.metric-value')
        .data(data);

      // Remove dots that are no longer needed i.e. if number of chart points has decreased.
      // dots.exit().remove();
      // Create any new dots that are needed i.e. if number of chart points has increased.
      dots.enter().append('circle')
        .attr('r', 7);

      // Update all dots to new positions.
      dots.attr('cx', function (d) { return lineChartXScale(d.date); })
        .attr('cy', function (d) { return lineChartYScale(d.value); })
        .attr('class', function (d) {
          let markerClass = 'metric-value';
          if (_.has(d, 'anomalyScore')) {
            markerClass += ' anomaly-marker ';
            markerClass += anomalyUtils.getSeverityWithLow(d.anomalyScore);
          }
          return markerClass;
        });
    }


    function drawSwimlane(swimlaneWidth, swimlaneHeight) {
      const data = scope.chartData.swimlane;

      // TODO - need to get bucket length from dataset.
      let cellWidth = swimlaneWidth / scope.chartData.line.length;
      if (cellWidth < 1) {
        cellWidth = 1;
      }

      const x = d3.time.scale().range([0, swimlaneWidth])
        .domain(d3.extent(data, (d) => d.date));

      const y = d3.scale.linear().range([swimlaneHeight, 0])
        .domain([0, swimlaneHeight]);

      // Set up the color scale to use for indicating score.
      const color = d3.scale.threshold()
        .domain([3, 25, 50, 75, 100])
        .range(['#d2e9f7', '#8bc8fb', '#ffdd00', '#ff7e00', '#fe5050']);

      const cells = swimlaneGroup.append('g')
        .attr('class', 'swimlane-cells')
        .selectAll('cells')
        .data(data);

      cells.enter().append('rect')
        .attr('x', (d) => lineChartXScale(d.date))
        .attr('y', 0)
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('class', (d) => d.value > 0 ? 'swimlane-cell' : 'swimlane-cell-hidden')
        .attr('width', cellWidth - 0)
        .attr('height', swimlaneHeight - 0)
        .style('fill', (d) => color(d.value));

    }

    function updateProgressBar() {
      const progressBar = $('.progress-bar');
      const pcnt = (scope.chartData.percentComplete < 100) ? scope.chartData.percentComplete : 0;
      progressBar.css('width', pcnt + '%');
    }
  }

  return {
    scope: {
      chartData: '=',
      swimlaneData: '=',
      selectedJobIds: '='
    },
    link: link
  };
});
