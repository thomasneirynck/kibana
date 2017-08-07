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
 * AngularJS directive for rendering a chart showing the distribution of values for
 * a metric on the field data card.
 */

import _ from 'lodash';
import d3 from 'd3';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlMetricDistributionChart', function ($filter, mlFieldDataSearchService) {

  function link(scope, element, attrs) {
    const svgWidth = attrs.width ? +attrs.width : 400;
    const svgHeight = attrs.height ? +attrs.height : 400;

    // Only label x axis so no need for margins.
    // TODO - do we want to label the y axis?
    const margin = { top: 0, right: 15, bottom: 25, left: 15 };

    const chartWidth = svgWidth - (margin.left + margin.right);
    const chartHeight = svgHeight - (margin.top + margin.bottom);

    let xScale = d3.scale.linear().range([0, chartWidth]);
    let yScale = d3.scale.linear().range([chartHeight, 0]);
    let xAxisMin = 0;
    let xAxisMax = 1;
    let chartGroup;

    const distributionArea = d3.svg.area()
      .x(function (d) { return xScale(d.x); })
      .y0(function () { return yScale(0); })
      .y1(function (d) { return yScale(d.y); });

    const MIN_BAR_WIDTH = 3;  // Minimum bar width, in pixels.

    scope.$on('render',function () {
      render();
    });

    element.on('$destroy', function () {
      scope.$destroy();
    });

    scope.$on('renderChart', () => {
      loadDistributionData();
    });

    function loadDistributionData() {
      // TODO - show chart loading icons
      const config = scope.chartConfig;
      mlFieldDataSearchService.getMetricDistributionData(
        scope.indexPattern.title,
        config.fieldName,
        5,
        scope.indexPattern.timeFieldName,
        scope.earliest,
        scope.latest)
      .then((resp) => {
        scope.distributionData = resp.results;
        scope.chartData = processDistributionData(resp.results);
        render();
      });
    }

    function processDistributionData(distributionData) {
      const chartData = [];

      // Process the raw distribution data so it is in a suitable format for plotting:
      const distributionDataLength = distributionData.length;
      if (distributionDataLength === 0) {
        return chartData;
      }

      // Adjust x axis min and max if there is a single bar.
      const minX = distributionData[0].minValue;
      const maxX = distributionData[distributionData.length - 1].maxValue;
      xAxisMin = minX;
      xAxisMax = maxX;
      if (maxX === minX) {
        if (minX !== 0) {
          xAxisMin = 0;
          xAxisMax = 2 * minX;
        } else {
          xAxisMax = 1;
        }
      }

      // Adjust the right hand x coordinates so that each bar is
      // at least MIN_BAR_WIDTH.
      // TODO - make sure last bar isn't cropped at RHS.
      const minBarWidth = (MIN_BAR_WIDTH / chartWidth) * (xAxisMax - xAxisMin);
      const processedData = [];
      let lastX1 = minX;
      _.each(distributionData, (data) => {
        const point = {
          x0: lastX1,
          x1: Math.max(lastX1 + minBarWidth, data.maxValue)
        };
        point.y = data.percent / (point.x1 - point.x0);
        processedData.push(point);
        lastX1 = point.x1;
      });

      if (maxX !== minX) {
        xAxisMax = _.last(processedData).x1;
      }

      // Adjust the maximum bar height to be (10 * median bar height).
      // TODO indicate if a bar height has been truncated?
      let barHeights = _.pluck(processedData, 'y');
      barHeights = barHeights.sort((a, b) => a - b);

      let maxBarHeight = 0;
      if (Math.abs(distributionDataLength % 2) === 1) {
        maxBarHeight = 10 * barHeights[(Math.floor(distributionDataLength / 2))];
      } else {
        maxBarHeight = 10 * (barHeights[(Math.floor(distributionDataLength / 2)) - 1] +
          barHeights[(Math.floor(distributionDataLength / 2))]) / 2;
      }

      _.each(processedData, (data) => {
        data.y = Math.min(data.y, maxBarHeight);
      });


      chartData.push({ x:minX, y: 0 });
      _.each(processedData, (data) => {
        chartData.push({ x:data.x0, y: data.y });
        chartData.push({ x:data.x1, y: data.y });
      });
      chartData.push({ x:processedData[processedData.length - 1].x1, y: 0 });


      return chartData;
    }

    function render() {
      init();
      drawAxes();
      drawDistributionArea();
    }

    function init() {
      const data = scope.chartData;

      // Clear any existing elements from the visualization,
      // then build the svg elements for the chart.
      const chartElement = d3.select(element.get(0));
      chartElement.select('svg').remove();

      const svg = chartElement.append('svg')
        .attr('width',  svgWidth)
        .attr('height', svgHeight);

      chartGroup = svg.append('g')
        .attr('class', 'distribution-chart')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const dataLength = data.length;
      if (dataLength > 0) {
        xScale = xScale.domain([xAxisMin, xAxisMax]);

        const yMax = d3.max(data, (d) => d.y);
        yScale = yScale.domain([0, yMax]);
      }
    }

    function drawAxes() {
      const axes = chartGroup.append('g')
        .attr('class', 'axes');

      // Calculate the number of ticks for the x axis, according to the
      // maximum label width. Note that d3 doesn't guarantee that the
      // axis will end up with this exact number of ticks.
      let maxXAxisLabelWidth = 0;
      const tempLabelText = axes.append('g')
        .attr('class', 'temp-axis-label tick');
      tempLabelText.selectAll('text.temp.axis').data(xScale.ticks())
        .enter()
        .append('text')
        .text(d => xScale.tickFormat()(d))
        .each(function () {
          maxXAxisLabelWidth = Math.max(this.getBBox().width, maxXAxisLabelWidth);
        })
      .remove();
      d3.select('.temp-axis-label').remove();
      let numTicks = Math.max(Math.floor(chartWidth / maxXAxisLabelWidth), 2);
      numTicks = Math.min(numTicks, 5);

      const xAxis = d3.svg.axis().scale(xScale).orient('bottom')
        .outerTickSize(1).tickPadding(10).ticks(numTicks);
      const yAxis = d3.svg.axis().scale(yScale).orient('left')
        .outerTickSize(0).ticks(0);

      axes.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${chartHeight})`)
        .call(xAxis);

      axes.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    }

    function drawDistributionArea() {
      const path = chartGroup.append('path');
      path.datum(scope.chartData)
        .attr('class', 'area')
        .attr('d', distributionArea)
        .on('mouseover', showChartTooltip)
        .on('mouseout', hideLineChartTooltip)
        .on('mousemove', showChartTooltip);

      function showChartTooltip() {
        const xPos = d3.mouse(this)[0];
        const yPos = d3.mouse(this)[1];
        const xVal = xScale.invert(xPos);

        let firstIdxGreater = (scope.chartData.length - 1);
        for (let i = 0; i < scope.chartData.length; i++) {
          if (scope.chartData[i].x > xVal) {
            firstIdxGreater = i;
            break;
          }
        }

        const distributionBandIdx = (firstIdxGreater / 2) - 1;
        let contents = `value:${xVal}`;
        if (distributionBandIdx >= 0 && distributionBandIdx < scope.distributionData.length) {
          const band = scope.distributionData[distributionBandIdx];
          const minValue = band.minValue;
          const maxValue = band.maxValue;
          const minValFormatted = $filter('number')(minValue);
          const maxValFormatted = $filter('number')(maxValue);
          if (maxValue > minValue) {
            contents = `${band.percent}% of documents have<br>values between ${minValFormatted} and ${maxValFormatted}`;
          } else {
            contents = `${band.percent}% of documents have<br>a value of ${minValFormatted}`;
          }
        }

        const tooltipDiv = d3.select('.ml-field-data-card-tooltip');
        tooltipDiv.style('opacity', .9)
          .style('display', 'block');
        tooltipDiv.html(contents);

        // Position the tooltip.
        const pos = path[0][0].getBoundingClientRect();
        const doc = document.documentElement;
        const scrollTop = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        const y = pos.top + scrollTop + yPos;
        const x = pos.left + xPos;
        const tooltipWidth = tooltipDiv.node().offsetWidth;
        if (x + tooltipWidth + 10 < document.body.clientWidth) {
          tooltipDiv.style('left', (x + 'px'))
            .style('top', y + 'px');
        } else {
          tooltipDiv.style('left', (x - tooltipWidth) + 'px')
            .style('top', y + 'px');
        }

      }

      function hideLineChartTooltip() {
        const tooltipDiv = d3.select('.ml-field-data-card-tooltip');
        tooltipDiv.transition()
          .duration(500)
          .style('opacity', 0)
          .style('display', 'none');
      }
    }

  }

  return {
    scope: {
      indexPattern: '=',
      earliest: '=',
      latest: '=',
      chartConfig: '='
    },
    link: link
  };
});
