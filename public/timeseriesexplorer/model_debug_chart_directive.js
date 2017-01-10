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
import angular from 'angular';
import d3 from 'd3';
import moment from 'moment';
import numeral from 'numeral';
import 'ui/timefilter';

import anomalyUtils from 'plugins/ml/util/anomaly_utils';
import ContextChartMask from 'plugins/ml/timeseriesexplorer/context_chart_mask';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlModelDebugChart', function ($compile, $timeout, timefilter) {

  function link(scope, element, attrs) {

    // Key dimensions for the viz and constituent charts.
    // TODO - implement resizing on window resize.
    let svgWidth = angular.element('.results-container').width();
    const focusZoomPanelHeight = 25;
    const focusChartHeight = 310;
    const focusHeight = focusZoomPanelHeight + focusChartHeight;
    const contextChartHeight = 60;
    const chartSpacing = 25;
    const swimlaneHeight = 30;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const svgHeight = focusHeight + contextChartHeight + swimlaneHeight + margin.top + margin.bottom;
    let vizWidth  = svgWidth  - margin.left - margin.right;

    const ZOOM_INTERVAL_OPTIONS = [
      { duration: moment.duration(1, 'h'), label: '1h'},
      { duration: moment.duration(12, 'h'), label: '12h'},
      { duration: moment.duration(1, 'd'), label: '1d'},
      { duration: moment.duration(1, 'w'), label: '1w'},
      { duration: moment.duration(2, 'w'), label: '2w'},
      { duration: moment.duration(1, 'M'), label: '1M'}];

    // Set up the color scale to use for indicating score.
    const anomalyColorScale = d3.scale.threshold()
      .domain([3, 25, 50, 75, 100])
      .range(['#d2e9f7', '#8bc8fb', '#ffdd00', '#ff7e00', '#fe5050']);

    // Create a gray-toned version of the color scale to use under the context chart mask.
    const anomalyGrayScale = d3.scale.threshold()
      .domain([3, 25, 50, 75, 100])
      .range(['#dce7ed', '#b0c5d6', '#b1a34e', '#b17f4e', '#c88686']);

    const focusXScale = d3.time.scale().range([0, vizWidth]);
    let focusYScale = d3.scale.linear().range([focusHeight, focusZoomPanelHeight]);

    const focusXAxis = d3.svg.axis().scale(focusXScale).orient('bottom')
      .innerTickSize(-focusChartHeight).outerTickSize(0).tickPadding(10);
    const focusYAxis = d3.svg.axis().scale(focusYScale).orient('left')
      .innerTickSize(-vizWidth).outerTickSize(0).tickPadding(10);

    // TODO - do we want to use interpolate('basis') to smooth the connecting lines?
    const focusValuesLine = d3.svg.line()
       .x(function (d) { return focusXScale(d.date); })
       .y(function (d) { return focusYScale(d.value); });
    const focusBoundedArea = d3.svg.area()
      .x (function (d) { return focusXScale(d.date) || 1; })
      .y0(function (d) { return focusYScale(d.upper); })
      .y1(function (d) { return focusYScale(d.lower); });

    let contextXScale = d3.time.scale().range([0, vizWidth]);
    let contextYScale = d3.scale.linear().range([contextChartHeight, 0]);

    const brush = d3.svg.brush();

    scope.$on('render',function (event, d) {
      render();
    });

    scope.$on('renderFocusChart',function (event, d) {
      renderFocusChart();
    });

    element.on('$destroy', function () {
      scope.$destroy();
    });

    // TODO - add in resize of chart when container is resized.
    //d3.select(window).on('resize', render);

    function render() {
      if (scope.contextChartData === undefined) {
        return;
      }

      // Set the size of the components according to the width of the parent container at render time.
      // TODO - re-render when size of container changes
      // e.g. on window resize, or if the Kibana navbar expands/collapses.
      svgWidth = angular.element('.results-container').width();

      // Clear any existing elements from the visualization,
      // then build the svg elements for the bubble chart.
      const chartElement = d3.select(element.get(0));
      chartElement.selectAll('*').remove();

      const svg = chartElement.append('svg')
        .attr('width',  svgWidth)
        .attr('height', svgHeight);


      // Set the size of the left margin according to the width of the largest y axis tick label.
      // Temporarily set the domain of the focus y axis to the full data range so that we can
      // measure the maximum tick label width on temporary text elements.
      focusYScale = focusYScale.domain([
        d3.min(scope.contextChartData, function (d) {
          return Math.min(d.value, d.lower);
        }),
        d3.max(scope.contextChartData, function (d) {
          return Math.max(d.value, d.upper);
        })
      ]);

      let maxYAxisLabelWidth = 0;
      const tempLabelText = svg.append('g')
        .attr('class', 'temp-axis-label tick');
      tempLabelText.selectAll('text.temp.axis').data(focusYScale.ticks())
        .enter()
        .append('text')
        .text(function (d) {
          return focusYScale.tickFormat()(d);
        })
        .each(function (d) {
          maxYAxisLabelWidth = Math.max(this.getBBox().width + focusYAxis.tickPadding(), maxYAxisLabelWidth);
        })
      .remove();
      d3.select('.temp-axis-label').remove();

      margin.left = (Math.max(maxYAxisLabelWidth, 40));
      vizWidth  = svgWidth  - margin.left - margin.right;
      focusXScale.range([0, vizWidth]);
      focusYAxis.innerTickSize(-vizWidth);

      const focus = svg.append('g')
        .attr('class', 'focus-chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      const context = svg.append('g')
        .attr('class', 'context-chart')
        .attr('transform', 'translate(' + margin.left + ',' + (focusHeight + margin.top + chartSpacing) + ')');

      // Draw each of the component elements.
      createFocusChart(focus, vizWidth, focusHeight);
      drawContextElements(context, vizWidth, contextChartHeight, swimlaneHeight);

      // Make appropriate selection in the context chart to trigger loading of the focus chart.
      let focusLoadFrom;
      let focusLoadTo;
      const contextXMin = contextXScale.domain()[0].getTime();
      const contextXMax = contextXScale.domain()[1].getTime();

      if (scope.zoomFrom) {
        focusLoadFrom = scope.zoomFrom.getTime();
      } else {
        focusLoadFrom = _.reduce(scope.contextChartData, (memo, point) =>
          Math.min(memo, point.date.getTime()) , new Date(2099, 12, 31).getTime());
      }
      focusLoadFrom = Math.max(focusLoadFrom, contextXMin);

      if (scope.zoomTo) {
        focusLoadTo = scope.zoomTo.getTime();
      } else {
        focusLoadTo = _.reduce(scope.contextChartData, (memo, point) => Math.max(memo, point.date.getTime()) , 0);
      }
      focusLoadTo = Math.min(focusLoadTo, contextXMax);

      if ((focusLoadFrom !== contextXMin) || (focusLoadTo !== contextXMax)) {
        setContextBrushExtent(new Date(focusLoadFrom), new Date(focusLoadTo), true);
      } else {
        // Don't set the brush if the selection is the full context chart domain.
        const selectedBounds = contextXScale.domain();
        scope.selectedBounds = { min: moment(new Date(selectedBounds[0])), max: moment(selectedBounds[1])};
        scope.$root.$broadcast('contextChartSelected', { from: selectedBounds[0], to: selectedBounds[1] });
      }
    }

    function createFocusChart(focusGroup, focusWidth, focusHeight) {
      // Split out creation of the focus chart from the rendering,
      // as we want to re-render the paths and points when the zoom area changes.

      // Add a group at the top to display info on the chart aggregation interval
      // and links to set the brush span to 1h, 1d, 1w etc.
      const zoomGroup = focusGroup.append('g')
        .attr('class', 'focus-zoom');
      zoomGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', focusWidth)
        .attr('height', focusZoomPanelHeight)
        .attr('class', 'chart-border');
      updateZoomInfoElements(zoomGroup, focusWidth);

      // Add border round plot area.
      const chartBorder = focusGroup.append('rect')
        .attr('x', 0)
        .attr('y', focusZoomPanelHeight)
        .attr('width', focusWidth)
        .attr('height', focusChartHeight)
        .attr('class', 'chart-border');

      // Add background for x axis.
      const xAxisBg = focusGroup.append('g')
        .attr('class', 'x-axis-background');
      xAxisBg.append('rect')
        .attr('x', 0)
        .attr('y', focusHeight)
        .attr('width', focusWidth)
        .attr('height', chartSpacing);
      xAxisBg.append('line')
        .attr('x1', 0)
        .attr('y1', focusHeight)
        .attr('x2', 0)
        .attr('y2', focusHeight + chartSpacing);
      xAxisBg.append('line')
        .attr('x1', focusWidth)
        .attr('y1', focusHeight)
        .attr('x2', focusWidth)
        .attr('y2', focusHeight + chartSpacing);
      xAxisBg.append('line')
        .attr('x1', 0)
        .attr('y1', focusHeight + chartSpacing)
        .attr('x2', focusWidth)
        .attr('y2', focusHeight + chartSpacing);


      const axes = focusGroup.append('g');
      axes.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + focusHeight + ')');
      axes.append('g')
        .attr('class', 'y axis');

      // Create the path elements for the bounded area and values line.
      focusGroup.append('path')
        .attr('class', 'area bounds');
      focusGroup.append('path')
        .attr('class', 'values-line');

      let focusMarkers = focusGroup.append('g')
        .attr('class', 'focus-chart-markers');

      // Define the div for the tooltip.
      // TODO - append to the chartElement rather than the body.
      d3.select('body').selectAll('div.ml-model-debug-point-tooltip').remove();
      const tooltipDiv = d3.select('body').append('div')
        .attr('class', 'ml-model-debug-point-tooltip')
        .style('opacity', 0);

      focusGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', focusWidth)
        .attr('height', focusHeight + 24)
        .attr('class', 'chart-border chart-border-highlight');
    }

    function renderFocusChart() {
      console.log('renderFocusChart scope.focusChartData:', scope.focusChartData);

      if (scope.focusChartData === undefined) {
        return;
      }

      const data = scope.focusChartData;

      const focusChart = d3.select('.focus-chart');

      focusChart.select('.zoom-interval')
        .text(scope.focusAggregationInterval.expression);

      angular.element('.zoom-aggregation-interval').text(scope.focusAggregationInterval.expression);

      // Render the axes.

      // Calculate the x axis domain.
      // Elasticsearch aggregation returns points at start of bucket,
      // so set the x-axis min to the start of the first aggregation interval,
      // and the x-axis max to the end of the last aggregation interval.
      const bounds = scope.selectedBounds;
      const aggMs = scope.focusAggregationInterval.asMilliseconds();
      const earliest = moment(Math.floor((bounds.min.valueOf()) / aggMs) * aggMs);
      const latest = moment(Math.ceil((bounds.max.valueOf()) / aggMs) * aggMs);

      focusXScale.domain([earliest.toDate(), latest.toDate()]);
      if (scope.focusChartData.length > 0) {
        // Set domain to min/max of bounds and value, and use default tick formatter.
        focusYScale = focusYScale.domain([d3.min(data, function (d) { return Math.min(d.value, d.lower); }),
          d3.max(data, function (d) { return Math.max(d.value, d.upper); })]);
        focusYAxis.tickFormat(null);
      } else {
        // Display 10 unlabelled ticks.
        focusYScale = focusYScale.domain([0, 10]);
        focusYAxis.tickFormat('');
      }
      focusChart.select('.x.axis')
        .call(focusXAxis);
      focusChart.select('.y.axis')
        .call(focusYAxis);

      // Render the bounds area and values line.
      focusChart.select('.area.bounds')
        .attr('d', focusBoundedArea(data));
      focusChart.select('.values-line')
        .attr('d', focusValuesLine(data));

      // Render circle markers for the points.
      // These are used for displaying tooltips on mouseover.
      const dots = d3.select('.focus-chart-markers').selectAll('.metric-value')
        .data(data);

      // Remove dots that are no longer needed i.e. if number of chart points has decreased.
      dots.exit().remove();
      // Create any new dots that are needed i.e. if number of chart points has increased.
      dots.enter().append('circle')
        .attr('r', 7)
        .on('mouseover', showFocusChartTooltip)
        .on('mouseout', hideFocusChartTooltip);

      // Update all dots to new positions.
      dots.attr('cx', function (d) { return focusXScale(d.date); })
        .attr('cy', function (d) { return focusYScale(d.value); })
        .attr('class', function (d) {
          let markerClass = 'metric-value';
          if (_.has(d, 'anomalyScore')) {
            markerClass += ' anomaly-marker ';
            markerClass += anomalyUtils.getSeverityWithLow(d.anomalyScore);
          }
          return markerClass;
        });

    }



    function updateZoomInfoElements() {
      // Update the zoom duration links to those applicable for the current time span.
      // Don't add links for any durations which would give a brush extent less than 10px.
      const bounds = timefilter.getActiveBounds();
      const boundsSecs = bounds.max.unix() - bounds.min.unix();
      const minSecs = (10 / vizWidth) * boundsSecs;

      let zoomLinks = '<a data-ms="' + scope.autoZoomDuration + '">auto</a> ';
      for (let i = 0; i < ZOOM_INTERVAL_OPTIONS.length; i++) {
        if (ZOOM_INTERVAL_OPTIONS[i].duration.asSeconds() > minSecs &&
            ZOOM_INTERVAL_OPTIONS[i].duration.asSeconds() < boundsSecs) {
          zoomLinks += '<a data-ms="' + ZOOM_INTERVAL_OPTIONS[i].duration.asMilliseconds() + '">';
          zoomLinks += ZOOM_INTERVAL_OPTIONS[i].label;
          zoomLinks += '</a> ';
        }
      }

      const zoomInfoGroup = d3.select('.focus-zoom');
      const links = zoomInfoGroup.append('foreignObject')
        .attr('width', 400)
        .attr('height', 25)
        .html('<div class="zoom-links">Zoom: ' + zoomLinks +
          '<span class="zoom-aggregation-interval-label">(aggregation interval: ' +
          '<span class="zoom-aggregation-interval"></span>' +
          ')</span></div>');

      $('.focus-zoom a').click(function (e) {
        e.preventDefault();
        setZoomInterval($(this).attr('data-ms'));
      });
    }

    function drawContextElements(contextGroup, contextWidth, contextChartHeight, swimlaneHeight) {
      const data = scope.contextChartData;

      contextXScale = d3.time.scale().range([0, contextWidth])
        .domain(calculateContextXAxisDomain());

      // Set the y axis domain so that the range of actual values takes up at least 50% of the full range.
      const valuesRange = {min: Number.MAX_VALUE, max: Number.MIN_VALUE};
      const boundsRange = {min: Number.MAX_VALUE, max: Number.MIN_VALUE};
      _.each(data, function (item) {
        valuesRange.min = Math.min(item.value, valuesRange.min);
        valuesRange.max = Math.max(item.value, valuesRange.max);
        boundsRange.min = Math.min(item.lower, boundsRange.min);
        boundsRange.max = Math.max(item.upper, boundsRange.max);
      });
      const dataMin = Math.min(valuesRange.min, boundsRange.min);
      const dataMax = Math.max(valuesRange.max, boundsRange.max);

      const chartLimits = {min: dataMin, max: dataMax};
      if ((valuesRange.max - valuesRange.min) < 0.5 * (dataMax - dataMin)) {
        if (valuesRange.min > dataMin) {
          chartLimits.min = valuesRange.min - (0.5 * (valuesRange.max - valuesRange.min));
        }

        if (valuesRange.max < dataMax) {
          chartLimits.max = valuesRange.max + (0.5 * (valuesRange.max - valuesRange.min));
        }
      }

      contextYScale = d3.scale.linear().range([contextChartHeight, 0])
        .domain([chartLimits.min, chartLimits.max]);

      const borders = contextGroup.append('g')
        .attr('class', 'axis');

      // Add borders left and right.
      borders.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', contextChartHeight + swimlaneHeight);
      borders.append('line')
        .attr('x1', contextWidth)
        .attr('y1', 0)
        .attr('x2', contextWidth)
        .attr('y2', contextChartHeight + swimlaneHeight);

      // Add x axis.
      const xAxis = d3.svg.axis().scale(contextXScale).orient('bottom')
        .innerTickSize(0).outerTickSize(0).tickPadding(10);

      contextGroup.datum(data);

      const area = d3.svg.area()
        .x(function (d) { return contextXScale(d.date); })
        .y0(function (d) { return contextYScale(Math.min(chartLimits.max, Math.max(d.lower, chartLimits.min))); })
        .y1(function (d) { return contextYScale(Math.max(chartLimits.min, Math.min(d.upper, chartLimits.max))); });

      const contextValuesLine = d3.svg.line()
       .x(function (d) { return contextXScale(d.date); })
       .y(function (d) { return contextYScale(d.value); });

      contextGroup.append('path')
        .datum(data)
        .attr('class', 'area context')
        .attr('d', area);

      contextGroup.append('path')
        .datum(data)
        .attr('class', 'values-line')
        .attr('d', contextValuesLine);

      contextGroup.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (contextChartHeight - 25) + ')')
        .call(xAxis);

      // Create and draw the anomaly swimlane.
      const swimlane = contextGroup.append('g')
        .attr('class', 'swimlane')
        .attr('transform', 'translate(0,' + contextChartHeight + ')');

      drawSwimlane(swimlane, contextWidth, swimlaneHeight);
      drawContextBrush(contextGroup);

    }

    function drawContextBrush(contextGroup) {
      const mask = new ContextChartMask(contextGroup, scope.contextChartData, swimlaneHeight)
        .x(contextXScale)
        .y(contextYScale);

      // Create the brush for zooming in to the focus area of interest.
      brush.x(contextXScale)
        .on('brush', brushing)
        .on('brushend', brushed);

      const brushGroup = contextGroup.append('g')
        .attr('class', 'x brush')
        .call(brush)
      .selectAll('rect')
        .attr('y', -1)
        .attr('height', contextChartHeight + swimlaneHeight + 1);


      // move the left and right resize areas over to
      // be under the handles
      contextGroup.selectAll('.w rect')
        .attr('x', -10)
        .attr('width', 10);

      contextGroup.selectAll('.e rect')
        .attr('x', 0)
        .attr('width', 10);

      const topBorder = contextGroup.append('rect')
        .attr('class', 'top-border')
        .attr('y', -2)
        .attr('height', 3);

      const leftHandle = contextGroup.append('foreignObject')
        .attr('width', 10)
        .attr('height', 90)
        .attr('class', 'brush-handle')
        .html('<div class="brush-handle-inner brush-handle-inner-left"><i class="fa fa-caret-left"></i></div>');
      const rightHandle = contextGroup.append('foreignObject')
        .attr('width', 10)
        .attr('height', 90)
        .attr('class', 'brush-handle')
        .html('<div class="brush-handle-inner brush-handle-inner-right"><i class="fa fa-caret-right"></i></div>');

      const border = d3.selectAll('.chart-border-highlight');

      function showBrush(show) {
        const brushExtent = brush.extent();
        mask.reveal(brushExtent);
        leftHandle.attr('x',contextXScale(brushExtent[0]) - 10);
        rightHandle.attr('x',contextXScale(brushExtent[1]) + 0);

        topBorder.attr('x', contextXScale(brushExtent[0]) + 1);
        topBorder.attr('width', contextXScale(brushExtent[1]) - contextXScale(brushExtent[0]) - 2);

        const visibility = show ? 'visible' : 'hidden';
        mask.style('visibility', visibility);
        leftHandle.style('visibility', visibility);
        rightHandle.style('visibility', visibility);
        topBorder.style('visibility', visibility);
        border.style('visibility', visibility);
      }

      function brushing() {
        const isEmpty = brush.empty();
        showBrush(!isEmpty);
      }

      function brushed() {
        const isEmpty = brush.empty();
        showBrush(!isEmpty);

        const selectedBounds = isEmpty ? contextXScale.domain() : brush.extent();
        const selectionMin = selectedBounds[0].getTime();
        const selectionMax = selectedBounds[1].getTime();

        // Set the color of the swimlane cells according to whether they are inside the selection.
        const swimlaneCells = contextGroup.selectAll('.swimlane-cell')
          .style('fill', function (d) {
            const cellMs = d.date.getTime();
            if (cellMs < selectionMin || cellMs > selectionMax) {
              return anomalyGrayScale(d.score);
            } else {
              return anomalyColorScale(d.score);
            }
          });

        scope.selectedBounds = { min: moment(selectionMin), max: moment(selectionMax)};
        scope.$root.$broadcast('contextChartSelected', { from: selectedBounds[0], to: selectedBounds[1] });
      }
    }

    function drawSwimlane(swimlaneGroup, swimlaneWidth, swimlaneHeight) {
      const data = scope.swimlaneData;

      // Calculate the x axis domain.
      // Elasticsearch aggregation returns points at start of bucket, so set the
      // x-axis min to the start of the aggregation interval.
      // Need to use the min(earliest) and max(earliest) of the context chart
      // aggregation to align the axes of the chart and swimlane elements.
      const xAxisDomain = calculateContextXAxisDomain();
      const x = d3.time.scale().range([0, swimlaneWidth])
        .domain(xAxisDomain);

      const y = d3.scale.linear().range([swimlaneHeight, 0])
        .domain([0, swimlaneHeight]);

      const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom')
        .innerTickSize(-swimlaneHeight)
        .outerTickSize(0);

      const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .tickValues(y.domain())
        .innerTickSize(-swimlaneWidth)
        .outerTickSize(0);

      const axes = swimlaneGroup.append('g');

      axes.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (swimlaneHeight) + ')')
        .call(xAxis);

      axes.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      const earliest = xAxisDomain[0].getTime();
      const latest = xAxisDomain[1].getTime();
      const swimlaneAggMs = scope.contextAggregationInterval.asMilliseconds();
      let cellWidth = swimlaneWidth / ((latest - earliest) / swimlaneAggMs);
      if (cellWidth < 1) {
        cellWidth = 1;
      }

      const cells = swimlaneGroup.append('g')
        .attr('class', 'swimlane-cells')
        .selectAll('cells')
        .data(data);

      cells.enter().append('rect')
        .attr('x', function (d) { return x(d.date); })
        .attr('y', 0)
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('class', function (d) { return d.score > 0 ? 'swimlane-cell' : 'swimlane-cell-hidden';})
        .attr('width', cellWidth)
        .attr('height', swimlaneHeight)
        .style('fill', function (d) { return anomalyColorScale(d.score);});

    }

    function calculateContextXAxisDomain() {
      // Calculates the x axis domain for the context elements.
      // Elasticsearch aggregation returns points at start of bucket,
      // so set the x-axis min to the start of the first aggregation interval,
      // and the x-axis max to the end of the last aggregation interval.
      // Context chart and swimlane use the same aggregation interval.
      const bounds = timefilter.getActiveBounds();
      const earliest = Math.min(_.first(scope.swimlaneData).date.getTime(), bounds.min.valueOf());

      const contextAggMs = scope.contextAggregationInterval.asMilliseconds();
      const earliestMs = Math.floor(earliest / contextAggMs) * contextAggMs;
      const latestMs = Math.ceil((bounds.max.valueOf()) / contextAggMs) * contextAggMs;

      return [new Date(earliestMs), new Date(latestMs)];
    }

    // Sets the extent of the brush on the context chart to the
    // supplied from and to Date objects.
    function setContextBrushExtent(from, to, fireEvent) {
      brush.extent([from, to]);
      brush(d3.select('.brush'));
      if (fireEvent) {
        brush.event(d3.select('.brush'));
      }
    }

    function setZoomInterval(ms) {
      const bounds = timefilter.getActiveBounds();
      const minBoundsMs = bounds.min.valueOf();
      const maxBoundsMs = bounds.max.valueOf();

      // Attempt to retain the same zoom end time.
      // If not, go back to the bounds start and add on the required millis.
      const millis = +ms;
      let to = scope.zoomTo.getTime();
      let from = to - millis;
      if (from < minBoundsMs) {
        from = minBoundsMs;
        to = Math.min(minBoundsMs + millis, maxBoundsMs);
      }

      setContextBrushExtent(new Date(from), new Date(to), true);
    }

    function showFocusChartTooltip(d) {
      // Show the time and metric values in the tooltip.
      // we are plotting the first ResponseAggConfig.
      const formattedDate = moment(d.date).format('MMMM Do YYYY, HH:mm');
      let contents = formattedDate + '<br/><hr/>';

      // TODO - need better formatting for small decimals.
      contents += ('value: ' + numeral(d.value).format('0,0.[00]'));
      contents += ('<br/>upper bounds: ' + numeral(d.upper).format('0,0.[00]'));
      contents += ('<br/>lower bounds: ' + numeral(d.lower).format('0,0.[00]'));

      if (_.has(d, 'anomalyScore')) {
        const score = parseInt(d.anomalyScore);
        const displayScore = (score > 0 ? score : '< 1');
        contents += ('<br/>anomaly score: ' + displayScore);
      }

      const tooltipDiv = d3.select('.ml-model-debug-point-tooltip');
      tooltipDiv.transition()
        .duration(200)
        .style('opacity', .9);
      tooltipDiv.html(contents);

      // Position the tooltip.
      const eventX = +(d3.event.pageX);
      const parentWidth = d3.select('body').node().getBoundingClientRect().width;
      const tooltipWidth = tooltipDiv.node().getBoundingClientRect().width;
      const markerRadius = +(d3.select(this).attr('r'));
      if (eventX + tooltipWidth + markerRadius < parentWidth) {
        tooltipDiv.style('left', (eventX + markerRadius) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      } else {
        tooltipDiv.style('left', eventX - (tooltipWidth + markerRadius) + 'px')
          .style('top', (d3.event.pageY - 28) + 'px');
      }
    }

    function hideFocusChartTooltip() {
      const tooltipDiv = d3.select('.ml-model-debug-point-tooltip');
      tooltipDiv.transition()
        .duration(500)
        .style('opacity', 0);
    }


  }

  return {
    scope: {
      contextChartData: '=',
      contextChartAnomalyData: '=',
      focusChartData: '=',
      swimlaneData: '=',
      contextAggregationInterval: '=',
      focusAggregationInterval: '=',
      zoomFrom: '=',
      zoomTo: '=',
      autoZoomDuration: '='
    },
    link: link
  };
});
