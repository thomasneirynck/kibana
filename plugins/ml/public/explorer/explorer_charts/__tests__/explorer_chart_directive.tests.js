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

import angular from 'angular';
import ngMock from 'ng_mock';
import expect from 'expect.js';

describe('ML - <ml-explorer-chart>', function () {
  let $scope;
  let $compile;

  beforeEach(() => {
    ngMock.module('kibana');
    ngMock.inject(function (_$compile_, $rootScope) {
      $compile = _$compile_;
      $scope = $rootScope.$new();
    });
  });

  afterEach(function () {
    $scope.$destroy();
  });

  it('Initialize', function () {
    const $element = $compile('<ml-explorer-chart />')($scope);
    $scope.$digest();

    // without setting any attributes and corresponding data
    // the directive just ends up being empty.
    expect($element.find('.content-wrapper').html()).to.be('');
    expect($element.find('ml-loading-indicator .loading-indicator').length).to.be(0);
  });

  it('Loading status active, no chart', function () {
    $scope.seriesConfig = {
      loading: true
    };

    const $element = $compile('<ml-explorer-chart series-config="seriesConfig" />')($scope);
    $scope.$digest();

    // test if the loading indicator is shown
    expect($element.find('ml-loading-indicator .loading-indicator').length).to.be(1);
  });

  it('Anomaly Explorer Chart with Data', function () {
    $scope.seriesConfig = {
      jobId: 'population-03',
      detectorIndex: 0,
      metricFunction: 'sum',
      timeField: '@timestamp',
      interval: '1h',
      datafeedConfig: {
        datafeed_id: 'datafeed-population-03',
        job_id: 'population-03',
        query_delay: '60s',
        frequency: '600s',
        indices: ['filebeat-7.0.0*'],
        types: ['doc'],
        query: { match_all: { boost: 1 } },
        scroll_size: 1000,
        chunking_config: { mode: 'auto' },
        state: 'stopped'
      },
      metricFieldName: 'nginx.access.body_sent.bytes',
      functionDescription: 'sum',
      bucketSpanSeconds: 3600,
      detectorLabel: 'high_sum(nginx.access.body_sent.bytes) over nginx.access.remote_ip (population-03)',
      fieldName: 'nginx.access.body_sent.bytes',
      entityFields: [{
        fieldName: 'nginx.access.remote_ip',
        fieldValue: '72.57.0.53',
        $$hashKey: 'object:813'
      }],
      infoTooltip: `<div class=\"explorer-chart-info-tooltip\">job ID: population-03<br/>
        aggregation interval: 1h<br/>chart function: sum nginx.access.body_sent.bytes<br/>
        nginx.access.remote_ip: 72.57.0.53</div>`,
      loading: false,
      chartData: [
        {
          date: new Date('2017-02-23T08:00:00.000Z'),
          value: 228243469, anomalyScore: 63.32916, numberOfCauses: 1,
          actual: [228243469], typical: [133107.7703441773]
        },
        { date: new Date('2017-02-23T09:00:00.000Z'), value: null },
        { date: new Date('2017-02-23T10:00:00.000Z'), value: null },
        { date: new Date('2017-02-23T11:00:00.000Z'), value: null },
        {
          date: new Date('2017-02-23T12:00:00.000Z'),
          value: 625736376, anomalyScore: 97.32085, numberOfCauses: 1,
          actual: [625736376], typical: [132830.424736973]
        },
        {
          date: new Date('2017-02-23T13:00:00.000Z'),
          value: 201039318, anomalyScore: 59.83488, numberOfCauses: 1,
          actual: [201039318], typical: [132739.5267403542]
        }
      ],
      plotEarliest: 1487534400000,
      plotLatest: 1488168000000,
      selectedEarliest: 1487808000000,
      selectedLatest: 1487894399999,
      chartLimits: {
        max: 646971228.9,
        min: 179804465.1
      }
    };

    // For these tests the directive needs to be rendered in the actual DOM,
    // because otherwise there wouldn't be a width available which would
    // trigger SVG errors. We use a fixed width to be able to test for
    // fine grained attributes of the chart.

    // First we create the element including a wrapper which sets the width:
    const $element = angular.element('<div style="width: 500px"><ml-explorer-chart series-config="seriesConfig" /></div>');

    // The following CSS rule is otherwise set via the directive's styles/main.less.
    // Without this the element would be an inline element and would
    // not inherit the parent's width.
    // TODO Find out why the less styles are not available during tests.
    $element.find('ml-explorer-chart').css('display', 'block');

    // Add the element to the body so it gets rendered
    $element.appendTo(document.body);

    // Compile the directive and run a $digest()
    $compile($element)($scope);
    $scope.$digest();

    // Now the chart should be loaded correctly and we're set up to run the tests

    // the loading indicator should not be shown
    expect($element.find('ml-loading-indicator .loading-indicator').length).to.be(0);

    // test if all expected elements are present
    const svg = $element.find('svg');
    expect(svg.length).to.be(1);

    const lineChart = svg.find('g.line-chart');
    expect(lineChart.length).to.be(1);

    const rects = lineChart.find('rect');
    expect(rects.length).to.be(2);

    const chartBorder = angular.element(rects[0]);
    expect(+chartBorder.attr('x')).to.be(0);
    expect(+chartBorder.attr('y')).to.be(0);
    expect(+chartBorder.attr('height')).to.be(170);

    const selectedInterval = angular.element(rects[1]);
    expect(selectedInterval.attr('class')).to.be('selected-interval');
    expect(+selectedInterval.attr('y')).to.be(1);
    expect(+selectedInterval.attr('height')).to.be(169);

    // skip this test for now
    // TODO find out why this doesn't work in IE11
    // const xAxisTicks = lineChart.find('.x.axis .tick');
    // expect(xAxisTicks.length).to.be(4);
    const yAxisTicks = lineChart.find('.y.axis .tick');
    expect(yAxisTicks.length).to.be(9);

    const paths = lineChart.find('path');
    expect(angular.element(paths[0]).attr('class')).to.be('domain');
    expect(angular.element(paths[1]).attr('class')).to.be('domain');

    const line = angular.element(paths[2]);
    expect(line.attr('class')).to.be('values-line');
    // this is not feasable to test because of minimal differences
    // across various browsers
    // expect(line.attr('d'))
    //   .to.be('M205.56285511363637,152.3732523349513M215.3515625,7.72727272727272L217.79873934659093,162.27272727272728');
    expect(line.attr('d')).not.to.be(undefined);

    const dots = lineChart.find('g.values-dots circle');
    expect(dots.length).to.be(1);

    const dot = angular.element(dots[0]);
    expect(dot.attr('r')).to.be('1.5');

    const chartMarkers = lineChart.find('g.chart-markers circle');
    expect(chartMarkers.length).to.be(3);
    expect(chartMarkers.toArray().map(d => +angular.element(d).attr('r'))).to.eql([7, 7, 7]);

    // remove the element from the DOM
    $element.remove();
  });
});
