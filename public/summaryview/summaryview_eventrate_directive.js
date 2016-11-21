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
 * stacked bar chart showing event rate for each job.
 */

import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import moment from 'moment';
import 'ui/timefilter';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';


import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlSummaryViewEventRate', function($compile, $timeout, timefilter, prlJobService, prlAnomalyRecordDetailsService, prlSwimlaneInspectorService, prlSwimlaneSelectionService) {

  function link(scope, element, attrs) {
    var rendered = false;

    scope.$on('render',function(event, d){
      if(!rendered) {
        rendered = true;
        render();
      }
    });

    element.on('$destroy', function () {
      scope.$destroy();
    });

    function render() {
      if (scope.chartData === undefined) {
        return;
      }

      var lanes = Object.keys(scope.chartData.data);

      var times = scope.chartData.times;
      var startTime = scope.chartData.earliest;
      var endTime = scope.chartData.latest;
      var stepSecs = scope.chartData.interval;
      var totalMax = 0;
      _.each(scope.chartData.max, function(jobMax) {
        totalMax += jobMax;
      });


      var data = {};
      _.each(times, function(t) {
        data[t] = {};
        _.each(scope.chartData.data, function(job, jobId) {
          if(job[t] !== undefined) {
            data[t][jobId] = job[t];
          }
        });
      });
      var margin = { top: 0, right: 0, bottom: 0, left: 0 };

      scope.chartWidth = scope.$parent.chartWidth;
      var numBuckets = parseInt((endTime-startTime)/stepSecs);

      var height = 100;

      var eventRateScale = d3.scale.linear().domain([0, totalMax]).range([0, height]);

      element.css('height', (height + 20) + 'px');

      var $eventrate = element.find("#eventrate");
      var $eventrateLegend = element.find("#eventrate-legend");
      $eventrate.empty();

      // console.log("chart",scope.chartWidth);
      var cellWidth = Math.floor(scope.chartWidth / numBuckets);
      var cellsPerTick = 1;
      if (cellWidth < 100) {
        var numTickLabels = scope.chartWidth/100;
        cellsPerTick = Math.max(Math.floor(numBuckets/numTickLabels), 2);
      }

      var timeTickLabels = [];
      for (var i = 0; i < numBuckets; i+=cellsPerTick) {
        timeTickLabels.push(moment.unix(startTime + (i*stepSecs)).format('MMM DD HH:mm'));
      }

      scope.$parent.lanes[scope.swimlaneType] = [];
      scope.lanes = scope.$parent.lanes;
      scope.laneMarkers = scope.$parent.laneMarkers;

      var monitorCellsContainer;

      function cellHover($event, index, time) {
        if(monitorCellsContainer === undefined) {
          monitorCellsContainer = angular.element("prl-summary-view-swimlane[swimlane-type='MONITOR'] .cells-container");
        }
        if(monitorCellsContainer !== undefined) {
          monitorCellsContainer.scope().hoverFuncs[index](scope.swimlaneType);
        }
      }
      scope.cellHover = cellHover;

      var color = d3.scale.category10();
      var jobColors = {};


      // dish out colurs before sorting by description so that the
      // naturally first job (the largest event count) has is blue.
      // because it looks nicer
      _.each(lanes, function(job, id){
        jobColors[job] = color(id);
      });

      // sort jobs by description
      lanes = lanes.sort(function(a, b) {
        return prlJobService.jobDescriptions[a] > prlJobService.jobDescriptions[b];
      });

      _.each(lanes, function(job, id){
        // jobColors[job] = color(id);
        var desc = prlJobService.jobDescriptions[job];
        var $job = $("<div>", {
          "class": "job",
          "data-tooltip": desc,
          html: "<div class='bullet' style='background-color:"+jobColors[job]+"'></div>"+ desc
        });
        $eventrateLegend.append($job);
      });

      var $cellsMarkerContainer = $("<div>", {
        "class": "cells-marker-container"
      });

      var cells = [];
      var time = startTime;
      for(var i=0;i<numBuckets;i++) {
        var $cell = $("<div>", {
          "class": "sl-cell",
          css: {
            "width": cellWidth+"px"
          },
          html: "<div class='floating-time-label'>"+(moment.unix(time).format('MMM DD HH:mm'))+"</div><i class='fa fa-caret-down'></i>"
        });
        $cellsMarkerContainer.append($cell);
        cells.push($cell);
        time += stepSecs;
      }
      scope.laneMarkers.push({swimlaneType: scope.swimlaneType, lane: cells});
      $eventrate.append($cellsMarkerContainer);

      var $cellsContainer = $("<div>", {
        "class": "cells-container"
      });
      $eventrate.append($cellsContainer);

      var time = startTime;
      for(var i=0;i<numBuckets;i++) {
        var $cell = $("<div>", {
          "class": "sl-cell",
          css: {
            "width": cellWidth+"px"
          },
          "data-lane-label": scope.swimlaneType,
          "data-time": time,

        });

        $cell.attr({
          "ng-mouseover": "cellHover($event, "+i+", "+time+")",
        });
        $cellsContainer.append($cell);
        time += stepSecs;
        scope.lanes[scope.swimlaneType].push($cell);
      }

      var barWidth = (cellWidth*numBuckets) / times.length;

      _.each(times, function(t) {
        var $col = $("<div>", {
          "class": "col",
          css: {
            "width": barWidth+"px",
            "height": height+"px"
          },
          "data-time": t
        });

        var d = data[t];
        if(d !== undefined) {
          var lastH = 0;
          _.each(d, function(job, jobId) {
            var h = eventRateScale(job);
            h = Math.round((h * 100) ) / 100;
            var $jobBar = $("<div>", {
              "class": "job-bar",
              css: {
                "width": (barWidth-1)+"px",
                "height": h+"px",
                "top": height - lastH - h + "px",
                "background-color": jobColors[jobId],
              },
              "data-time": t
            });
            $col.append($jobBar);
            lastH += h;
          });
        }

        $eventrate.append($col);
      });

      var $laneTimes = $("<div>", {
        "class": "time-tick-labels"
      });
      _.each(timeTickLabels, function(label, i) {
        $laneTimes.append($("<span>", {
          "class": "tick-label",
          "text": label,
          "css": {
            "margin-left": (i * cellWidth * cellsPerTick)+"px"
          }
        }));
      });

      $eventrate.append($laneTimes);

      $compile($eventrate)(scope);
      $compile($eventrateLegend)(scope);
    }
  }

  return {
    scope: {
      chartTitle: "@",
      chartData: "=",
      expansionDirective: "@",
      expansionChartData: "=",
      swimlaneType: "@",
      containerId: "@",
      selectedJobIds: "=",
      expanded: "=",
      chartWidth: "@",
    },
    link: link,
    template: "<div><div id='eventrate-legend'></div><div id='eventrate'></div></div>"
  };
});