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
 * Angular controller for the Ml influencer heatmap visualization.
 * The controller builds and renders the appropriate chart type (treemap,
 * flat or nested bubble chart) depending on the visualization 'chartType' parameter.
 */
import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import moment from 'moment';
import angular from 'angular';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.controller('MlInfluencerHeatmapController', function ($scope) {

  /**
   * Recreate the heatmap when:
   * - the underlying data changes (esResponse)
   * - one of the view options changes (vis.params)
   */
  $scope.$watchMulti(['esResponse', 'vis.params'], function ([resp]) {

    if (!resp) {
      return;
    }

    console.log('MlInfluencerHeatmapController esResponse:', resp);

    // Process the aggregations in the ES response which provide the data for the chart.
    $scope.processAggregations(resp.aggregations);

    // Tell the influencer heatmap directive to render.
    $scope.$emit('render');

  });

  $scope.processAggregations = function (aggregations) {

    const dataByViewBy = {};

    if (aggregations) {
      // Retrieve the ids of the configured viewBy aggregations.
      const viewBy1AggId = $scope.vis.aggs.bySchemaName.viewBy1[0].id;   // e.g. for 'influencerFieldName'
      const viewBy2AggId = $scope.vis.aggs.bySchemaName.viewBy2[0].id;   // e.g. for 'influencerFieldValue'

      // Retrieve the 'colorBy' and 'sizeBy' metric aggregations.
      const colorByAgg = $scope.vis.aggs.bySchemaName.colorBy[0];    // e.g. for max(anomalyScore)
      const sizeByAgg = $scope.vis.aggs.bySchemaName.sizeBy[0];      // e.g. for sum(anomalyScore)

      // Get the buckets of the top-level aggregation
      const buckets = aggregations[viewBy1AggId].buckets;


      _.each(buckets, function (bucket) {
        const viewBy1 = bucket.key;
        const valuesForViewBy = {};
        dataByViewBy[viewBy1] = valuesForViewBy;

        const bucketsForViewByValue = bucket[viewBy2AggId].buckets;

        _.each(bucketsForViewByValue, function (valueBucket) {
          // viewBy2 is the 'valueBucket' key.
          valuesForViewBy[valueBucket.key] = {
            colorByValue: colorByAgg.getValue(valueBucket),
            sizeByValue: sizeByAgg.getValue(valueBucket)
          };
        });
      });
      console.log('processAggregations processed data:', dataByViewBy);
    }

    $scope.metricsData = dataByViewBy;

  };


})
.directive('mlInfluencerHeatmap', function ($compile) {

  function link(scope, element, attrs) {

    scope.$on('render',function (event, d) {
      scope.chartData = buildChartData();
      console.log('scope.chartData:', scope.chartData);
      //element.parent().unbind('resize');
      renderChart();
    });


    function buildChartData() {
      const chartData = {
        'name': '',
        'children' : []
      };

      if (scope.metricsData) {
        _.each(scope.metricsData, function (dataForViewBy1, viewBy1Key) {
          const grandchildren = [];
          _.each(dataForViewBy1, function (dataForViewB2, viewBy2Key) {
            grandchildren.push({'group':viewBy1Key,
              'name':viewBy2Key,
              'colorByValue': dataForViewB2.colorByValue,
              'sizeByValue': dataForViewB2.sizeByValue});
          });

          chartData.children.push({'name':viewBy1Key, 'children': grandchildren});
        });

      }


      return chartData;
    }


    function renderChart() {
      if (scope.vis.params.chartType === 'circle') {
        renderCircleChart();
      } else if (scope.vis.params.chartType === 'treemap') {
        renderZoomTreemap();
      } else {
        renderBubbleChart();
      }
    }


    function renderCircleChart() {
//    const sampleData = {
//      'name': 'root',
//      'children': [
//        {
//        'name': 'instance',
//        'children': [
//          {'group': 'instance', 'name': 'instance-i9387', 'sizeByValue': 243, 'colorByValue': 92},
//          {'group': 'instance', 'name': 'instance-i93', 'sizeByValue': 167, 'colorByValue': 23},
//          {'group': 'instance', 'name': 'instance-i', 'sizeByValue': 47, 'colorByValue': 6},
//          {'group': 'instance', 'name': 'instance-i9adff32', 'sizeByValue': 108, 'colorByValue': 54},
//          {'group': 'instance', 'name': 'instance-i9adff34', 'sizeByValue': 64, 'colorByValue':64},
//          {'group': 'instance', 'name': 'instance-i9adff36', 'sizeByValue': 192, 'colorByValue': 84}
//        ]
//        },
//        {
//          'name': 'region',
//          'children': [
//            {'group': 'region', 'name': 'us-west2', 'sizeByValue': 45, 'colorByValue': 45},
//            {'group': 'region', 'name': 'us-east2', 'sizeByValue': 77, 'colorByValue': 77},
//            {'group': 'region', 'name': 'us-east1', 'sizeByValue': 12, 'colorByValue': 12}
//          ]
//        }
//      ]
//     };

      const diameter = 440;
      const formatVal = d3.format('.1f');

      // Get the labels for the two metric aggregations, used in the tooltip.
      const colorByMetricLabel = scope.vis.aggs.bySchemaName.colorBy[0].makeLabel();
      const sizeByMetricLabel = scope.vis.aggs.bySchemaName.sizeBy[0].makeLabel();

      const compiledTooltip = _.template('<div class="ml-influencer-heatmap-tooltip"><%= group %>: <%= name %>' +
          '<hr/><%= colorByMetricLabel %>: <%= colorByValue %>' +
          '<hr/><%= sizeByMetricLabel %>: <%= sizeByValue %></div>');

      const pack = d3.layout.pack()
        .size([diameter - 4, diameter - 4])
        .value(function (d) { return d.sizeByValue; });


      // Clear any existing elements from the visualization,
      // then build the svg elements for the bubble chart.
      const heatMapElement = d3.select(element.get(0));
      heatMapElement.selectAll('*').remove();

      const svg = heatMapElement.append('svg')
        .attr('width', diameter)
        .attr('height', diameter)
        .attr('class', 'circle-pack')
      .append('g')
        .attr('transform', 'translate(2,2)');


      const nodes = svg.datum(scope.chartData).selectAll('.node')
        .data(pack.nodes)
        .enter().append('g')
        .attr('class', function (d) { return getNodeClasses(d); })
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .attr('tooltip-html-unsafe', function (d) {
          if (!d.children) {
            const tooltipOptions = {
              'group': d.group,
              'name': d.name,
              'colorByMetricLabel': colorByMetricLabel,
              'colorByValue': formatVal(d.colorByValue),
              'sizeByMetricLabel': sizeByMetricLabel,
              'sizeByValue': formatVal(d.sizeByValue)
            };
            return compiledTooltip(tooltipOptions);
          } else {
            return d.name;
          }
        })
        .attr('tooltip-append-to-body', true);

      const circles = nodes.append('circle')
        .attr('r', function (d) { return d.r; });

      nodes.filter(function (d) { return !d.children; }).append('text')
        .attr('dy', '.3em')
        .style('text-anchor', 'middle')
        .text(function (d) { return d.name.substring(0, d.r / 3); });

      // Need to compile the node elements to get the tooltip to display.
      angular.forEach(nodes, function (node) {
        const nodeElement = angular.element(node);
        $compile(nodeElement)(scope);
      });

    }


    function renderTreemap() {
      // Get the labels for the two metric aggregations, used in the tooltip.
      const colorByMetricLabel = scope.vis.aggs.bySchemaName.colorBy[0].makeLabel();
      const sizeByMetricLabel = scope.vis.aggs.bySchemaName.sizeBy[0].makeLabel();

      const compiledTooltip = _.template('<div class="ml-influencer-heatmap-tooltip"><%= group %>: <%= name %>' +
        '<hr/><%= colorByMetricLabel %>: <%= colorByValue %>' +
        '<hr/><%= sizeByMetricLabel %>: <%= sizeByValue %></div>');

      console.log('element:', element);
      console.log('element width:', element.parent().width());
      console.log('element parent:', element.parent());
      console.log('element parent width:', element.parent().width());



      // TODO - Bottom few pixels of treemap are getting cropped for some reason.
      const parent = element.parent();
      const margin = {top: 10, right: 20, bottom: 10, left: 20};
      const width = Math.max(parent.width() - 50, 300) - margin.left - margin.right;
      const height = Math.max(parent.height() - 10, 200) - margin.top - margin.bottom;

      const formatVal = d3.format('.1f');

      const treemap = d3.layout.treemap()
        .size([width, height])
        .padding([20, 3, 0, 3])
        .value(function (d) { return d.sizeByValue; });


      // Clear any existing elements from the visualization,
      // then build the div elements for the treemap.
      const heatMapElement = d3.select(element.get(0));
      heatMapElement.selectAll('*').remove();

      const div = heatMapElement.append('div')
        .attr('class', 'treemap')
        .style('position', 'relative')
        .style('width', (width + margin.left + margin.right) + 'px')
        .style('height', (height + margin.top + margin.bottom) + 'px')
        .style('left', margin.left + 'px')
        .style('top', margin.top + 'px');

      const node = div.datum(scope.chartData).selectAll('.node')
        .data(treemap.nodes)
        .enter().append('div')
        .attr('class', 'node')
        .attr('class', function (d) { return getNodeClasses(d); })
        .attr('tooltip-html-unsafe', function (d) {
          if (!d.children) {
            const tooltipOptions = {
              'group': d.group,
              'name': d.name,
              'colorByMetricLabel': colorByMetricLabel,
              'colorByValue': formatVal(d.colorByValue),
              'sizeByMetricLabel': sizeByMetricLabel,
              'sizeByValue': formatVal(d.sizeByValue)
            };
            return compiledTooltip(tooltipOptions);
          } else {
            return d.name;
          }
        })
        .attr('tooltip-append-to-body', true)
        .attr('tooltip-placement', function (d) {
          if (d.children) {
            return 'top';
          } else {
            if ((d.x + d.dx) < (parent.width() - 100)) {
              return 'right';
            } else {
              return 'top';
            }
          }
        })
        .call(position)
        .text(function (d) { return d.name; });

      // Need to compile the div elements to get the tooltip to display.
      angular.forEach(node, function (div) {
        const divElement = angular.element(div);
        $compile(divElement)(scope);
      });


      function position() {
        this.style('left', function (d) { return d.x + 'px'; })
        .style('top', function (d) { return d.y + 'px'; })
        .style('width', function (d) { return Math.max(0, d.dx - 1) + 'px'; })
        .style('height', function (d) { return Math.max(0, d.dy - 1) + 'px'; });
      }

    }


    function renderZoomTreemap() {

      // Get the labels for the two metric aggregations, used in the tooltip.
      const colorByMetricLabel = scope.vis.aggs.bySchemaName.colorBy[0].makeLabel();
      const sizeByMetricLabel = scope.vis.aggs.bySchemaName.sizeBy[0].makeLabel();

      const compiledTooltip = _.template('<div class="ml-influencer-heatmap-tooltip"><%= group %>: <%= name %>' +
          '<hr/><%= colorByMetricLabel %>: <%= colorByValue %>' +
          '<hr/><%= sizeByMetricLabel %>: <%= sizeByValue %></div>');

      const formatVal = d3.format('.1f');

      const parent = element.parent();
      //const w = Math.max(parent.width()-50, 700);
      //const h = Math.max(parent.height()-10, 600);

      const w = 1000 - 80;
      const h = 600 - 180;
      const x = d3.scale.linear().range([0, w]);
      const y = d3.scale.linear().range([0, h]);
      let root;
      let node;

      const treemap = d3.layout.treemap()
        .round(false)
        .padding([20, 3, 0, 3])
        .size([w, h])
        .sticky(true)
        .value(function (d) { return d.sizeByValue; });


      const heatMapElement = d3.select(element.get(0));
      heatMapElement.selectAll('*').remove();

      const svg = heatMapElement.append('div')
        .attr('class', 'treemap chart')
        .style('width', w + 'px')
        .style('height', h + 'px')
      .append('svg:svg')
        .attr('width', w)
        .attr('height', h)
      .append('svg:g')
        .attr('transform', 'translate(.5,.5)');


      node = root = scope.chartData;

      const nodes = treemap.nodes(root);

      const cells = svg.selectAll('g')
        .data(nodes)
        .enter().append('svg:g')
        .attr('class', function (d) { return getNodeClasses(d); })
        .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .attr('tooltip-html-unsafe', function (d) {
          if (!d.children) {
            const tooltipOptions = {
              'group': d.group,
              'name': d.name,
              'colorByMetricLabel': colorByMetricLabel,
              'colorByValue': formatVal(d.colorByValue),
              'sizeByMetricLabel': sizeByMetricLabel,
              'sizeByValue': formatVal(d.sizeByValue)
            };
            return compiledTooltip(tooltipOptions);
          } else {
            return d.name;
          }
        })
        .attr('tooltip-placement', function (d) {
          if (d.children) {
            return 'top';
          } else {
            if ((d.x + d.dx) < (parent.width() - 140)) {
              return 'right';
            } else {
              return 'top';
            }
          }
        })
        .attr('tooltip-append-to-body', true)
        .on('click', function (d) { return zoom(node === d.parent ? root : d.parent); });

      const rects = cells.append('svg:rect')
        .attr('width', function (d) { return d.dx - 1; })
        .attr('height', function (d) { return d.dy - 1; });

      cells.append('svg:text')
        .attr('x', function (d) { return d.dx / 2; })
        .attr('y', function (d) { return d.children ? 10 : d.dy / 2; })
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text(function (d) { return d.name.substring(0, d.dx / 3); })
        .style('font-weight', function (d) { return d.children ? 'bold' : 'normal'; })
        .style('opacity', function (d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });


      // Zoom back when clicking on chart container div.
      element.closest('.visualize-chart').off('click');
      element.closest('.visualize-chart').on('click', function () { zoom(root); });

      // Need to compile the cell elements to get the tooltip to display.
      angular.forEach(cells, function (cell) {
        const cellElement = angular.element(cell);
        $compile(cellElement)(scope);
      });


      // Re-render if the window is resized
//      element.parent().unbind('resize');
//      element.parent().bind('resize', function () {
//        if (scope.chartData) {
//          // Need to programmatically remove any tooltips that is showing.
//          if (angular.element('.tooltip').length) {
//            angular.element('.tooltip').remove();
//          }
//
//          console.log('resizeEvent node:', node);
//
//          if (node) {
//            w = Math.max(parent.width()-50, 500) - 80;
//            h = Math.max(parent.height()-10, 400) - 180;
//            zoom(node);
//          }
//
//        }
//
//      });


      function zoom(d) {
        if (d !== undefined) {
          const kx = w / d.dx;
          const ky = h / d.dy;
          x.domain([d.x, d.x + d.dx]);
          y.domain([d.y, d.y + d.dy]);

          const t = svg.selectAll('g.node').transition()
            .duration(750)
            .attr('transform', function (d) { return 'translate(' + x(d.x) + ',' + y(d.y) + ')'; });

          t.select('rect')
            .attr('width', function (d) { return kx * d.dx - 1; })
            .attr('height', function (d) { return ky * d.dy - 1; });

          t.select('text')
            .attr('x', function (d) { return kx * d.dx / 2; })
            .attr('y', function (d) { return d.children ? 10 : ky * d.dy / 2; })
            .style('opacity', function (d) { return kx * d.dx > d.w ? 1 : 0; });

          node = d;
          if (d3.event) {
            d3.event.stopPropagation();
          }
        }
      }

    }



    function renderBubbleChart() {
//      const sampleData = {
//        'name': 'root',
//        'children': [
//           {'name': 'instance-i9387', 'colorByValue': 92},
//           {'name': 'instance-i93', 'colorByValue': 23},
//           {'name': 'instance-i', 'colorByValue': 6},
//           {'name': 'instance-i9adff32', 'colorByValue': 54},
//           {'name': 'instance-i9adff34', 'colorByValue':64},
//           {'name': 'instance-i9adff36', 'colorByValue': 84}
//        ]
//         };


      const diameter = 660;
      const formatVal = d3.format('.1f');

      // Get the labels for the two metric aggregations, used in the tooltip.
      const colorByMetricLabel = scope.vis.aggs.bySchemaName.colorBy[0].makeLabel();
      const sizeByMetricLabel = scope.vis.aggs.bySchemaName.sizeBy[0].makeLabel();

      const compiledTooltip = _.template('<div class="ml-influencer-heatmap-tooltip"><%= group %>: <%= name %>' +
          '<hr/><%= colorByMetricLabel %>: <%= colorByValue %>' +
          '<hr/><%= sizeByMetricLabel %>: <%= sizeByValue %></div>');

      const bubble = d3.layout.pack()
        .sort(null)
        .size([diameter, diameter])
        .padding(1.5);


      // Clear any existing elements from the visualization,
      // then build the svg elements for the bubble chart.
      const heatMapElement = d3.select(element.get(0));
      heatMapElement.selectAll('*').remove();

      const svg = heatMapElement.append('svg')
        .attr('width', diameter)
        .attr('height', diameter)
        .attr('class', 'circle-pack');

      const nodes = svg.selectAll('.node')
        .data(bubble.nodes(flattenChartData(scope.chartData))
        .filter(function (d) { return !d.children; }))
        .enter().append('g')
        .attr('class', function (d) { return getNodeClasses(d); })
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        })
        .attr('tooltip-html-unsafe', function (d) {
          const tooltipOptions = {
            'group': d.group,
            'name': d.name,
            'colorByMetricLabel': colorByMetricLabel,
            'colorByValue': formatVal(d.colorByValue),
            'sizeByMetricLabel': sizeByMetricLabel,
            'sizeByValue': formatVal(d.value)
          };
          return compiledTooltip(tooltipOptions);
        })
        .attr('tooltip-append-to-body', true);

      const circles = nodes.append('circle')
      .attr('r', function (d) { return d.r; });

      // Need to compile the circle elements to get the tooltip to display.
      angular.forEach(nodes, function (node) {
        const nodeElement = angular.element(node);
        $compile(nodeElement)(scope);
      });

      nodes.append('text')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')
      .text(function (d) { return d.name.substring(0, d.r / 3); });


      // Returns a flattened hierarchy containing all leaf nodes under the root.
      function flattenChartData(root) {
        const flatChartData = [];

        function recurse(name, node) {
          if (node.children) {
            node.children.forEach(function (child) {
              recurse(node.name, child);
            });
          }
          else {
            flatChartData.push({group: node.group, name: node.name, value: node.sizeByValue, colorByValue: node.colorByValue});
          }
        }

        recurse(null, root);
        return {children: flatChartData};
      }
    }


    // Returns a space delimited list of class to attach to the node with the specified model.
    function getNodeClasses(d) {
      const nodeClasses = ['node'];
      if (!d.children) {
        nodeClasses.push('leaf');
        if (_.has(d, 'colorByValue')) {
          const colorByValue = d.colorByValue;
          if (colorByValue >= 0 && colorByValue < 25) {
            nodeClasses.push('warning');
          } else if (colorByValue < 50) {
            nodeClasses.push('minor');
          } else if (colorByValue < 75) {
            nodeClasses.push('major');
          } else if (colorByValue <= 100) {
            nodeClasses.push('critical');
          } else {
            nodeClasses.push('unknown');
          }
        }
      }
      return nodeClasses.join(' ');
    }
  }

  return {
    link: link
  };

});
