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
 * Swimlane showing record level normalized probability by detector.
 */

import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import moment from 'moment';
import 'ui/timefilter';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlSummaryViewSwimlane', function($compile, $timeout, timefilter, prlJobService, prlAnomalyRecordDetailsService, prlSwimlaneInspectorService, prlSwimlaneSelectionService) {

  var SWIMLANE_TYPES = prlAnomalyRecordDetailsService.type;

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

    scope.toggleRow = function() {
      scope.expanded = !scope.expanded;
    };

    if (scope.chartData !== undefined) {
      // render();
    }

    function render() {
      if (scope.chartData === undefined) {
        return;
      }

      var INSPECTOR_MODE = (SWIMLANE_TYPES[scope.swimlaneType] === SWIMLANE_TYPES.INSPECTOR);
      // console.log("render() called")
      var lanes = scope.chartData.laneLabels;
      var startTime = scope.chartData.earliest;
      var endTime = scope.chartData.latest;
      var stepSecs = scope.chartData.interval;
      var points = scope.chartData.points;

      var margin = { top: 0, right: 0, bottom: 0, left: 0 };

      function colorScore(d) {
        return anomalyUtils.getSeverityColor(d.value);
      }

      scope.chartWidth = scope.$parent.chartWidth;
      if(INSPECTOR_MODE) {
        scope.chartWidth = $(scope.containerId).width() - 70;
      }

      var numBuckets = parseInt((endTime-startTime)/stepSecs);
      var cellHeight = 30;
      var height = (lanes.length + 1) * cellHeight - 10;
      var laneLabelWidth = 170;

      element.css('height', (height + 20) + 'px');
      var $swimlanes = element.find("#swimlanes");
      $swimlanes.empty();

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
      scope.laneMarkers = scope.$parent.laneMarkers;
      scope.laneMarkers.push({swimlaneType: scope.swimlaneType, lane: cells});
      $swimlanes.append($cellsMarkerContainer);

      function cellHover($event, laneLabel, bucketScore, index, time, swimlaneType) {

        if(!prlAnomalyRecordDetailsService.isLocked()) {
          var isInspector = SWIMLANE_TYPES[scope.swimlaneType] === SWIMLANE_TYPES.INSPECTOR;
          if((!prlSwimlaneInspectorService.controls.visible || (prlSwimlaneInspectorService.controls.visible && isInspector)) && !prlSwimlaneSelectionService.selection.active) {
            // console.log(laneLabel,index,time)
            _.each(scope.lanes, function(l) {
              for(var j=0;j<l.length;j++) {
                l[j].removeClass("sl-cell-hover");
              }
              l[index].addClass("sl-cell-hover");
            });

            _.each(scope.laneMarkers, function(l) {
              var lane = l.lane;
              for(var j=0;j<lane.length;j++) {
                lane[j].removeClass("sl-cell-hover sl-cell-active-hover");
              }
              if(l.swimlaneType === swimlaneType) {
                lane[index].addClass("sl-cell-active-hover");
              } else {
                lane[index].addClass("sl-cell-hover");
              }
            });

            var target = $event.currentTarget;
            // only display records if the cell has a colored card inside it
            if(target.children.length) {
              var top = target.parentElement.offsetTop;

              var inspector = {};
              if(isInspector) {
                inspector = {
                  swimlaneType: prlSwimlaneInspectorService.getSwimlaneType(),
                  timeRange: prlSwimlaneInspectorService.getTimeRange(),
                  selectedJobIds: prlSwimlaneInspectorService.getSelectedJobIds(),
                };
              }

              // if hovering over eventrate, force the record for Monitor to be displayed.
              if(SWIMLANE_TYPES[swimlaneType] === SWIMLANE_TYPES.EVENTRATE) {
                swimlaneType = "MONITOR";
              }

              prlAnomalyRecordDetailsService.hover(time, laneLabel, bucketScore, top, target, swimlaneType, inspector);
            }
          }
        }
      }

      function cellClick($event, laneLabel, bucketScore, index, time, swimlaneType) {

        var $target = $($event.target);
        // if the edge of the outer cell has been clicked by accident, find the inner cell.
        if($target.hasClass("sl-cell")) {
          $target = $target.find(".sl-cell-inner");
        }
        if($target) {
          var isEmptyCell = ($event.currentTarget.children.length===0);
          // don't toggle the lock if the inspector is still visible
          // or allow toggle if inspector is visible and you're clicking on a card in the inspector.
          if(!prlSwimlaneInspectorService.controls.visible ||
            (prlSwimlaneInspectorService.controls.visible && SWIMLANE_TYPES[swimlaneType] === SWIMLANE_TYPES.INSPECTOR)) {
            // if cell is empty, only toggle disable lock by passing undefined
            prlAnomalyRecordDetailsService.toggleLock(isEmptyCell?undefined:$target);
          }
          // force the hover event on the target, so the disable click highlights the current card
          // placed in a 1ms timeout because the inspector's mouse up event must must happen first
          // and that is in a 0ms timeout.
          $timeout(function() {
            cellHover($event, laneLabel, bucketScore, index, time, swimlaneType);
          }, 1);
        }
      }

      scope.lanes = scope.$parent.lanes;

      // if job, sort lanes based on job description
      if(SWIMLANE_TYPES[scope.swimlaneType] === SWIMLANE_TYPES.JOB) {
        lanes = lanes.sort(function(a, b) {
          return prlJobService.jobDescriptions[a] > prlJobService.jobDescriptions[b];
        });
      }
      _.each(lanes, function(lane) {
        var rowScope = scope.$new();
        scope.$parent.lanes[lane] = [];

        rowScope.showExpansion = false;
        rowScope.expandRow = function() {
          rowScope.showExpansion = !rowScope.showExpansion;
        };

        rowScope.cellHover = cellHover;
        rowScope.cellClick = cellClick;
        rowScope.startDrag = prlSwimlaneSelectionService.startDrag;

        rowScope.detectorPerJobChartData = scope.$parent.detectorPerJobChartData;
        var orginalSelectedJobIds = rowScope.selectedJobIds;

        rowScope.selectedJobIds = [lane];

        var $lane = $("<div>", {
          "class": "lane",
        })
        .data("jobIds", scope.selectedJobIds);

        var label = lane;
        var isBucketWidth = false;
        // for job types and inpector for job types, mark whether the cell width is the same as the bucketSpan
        // ie, the lowest level we can zoom to
        if(SWIMLANE_TYPES[rowScope.swimlaneType] === SWIMLANE_TYPES.JOB ||
          (SWIMLANE_TYPES[rowScope.swimlaneType] === SWIMLANE_TYPES.INSPECTOR &&
            SWIMLANE_TYPES[prlSwimlaneInspectorService.getSwimlaneType()] === SWIMLANE_TYPES.JOB)) {
          label = prlJobService.jobDescriptions[lane];
          isBucketWidth = (prlJobService.basicJobs[lane].bucketSpan === stepSecs);
        } else if(SWIMLANE_TYPES[rowScope.swimlaneType] === SWIMLANE_TYPES.DETECTOR ||
          (SWIMLANE_TYPES[rowScope.swimlaneType] === SWIMLANE_TYPES.INSPECTOR &&
            SWIMLANE_TYPES[prlSwimlaneInspectorService.getSwimlaneType()] === SWIMLANE_TYPES.DETECTOR)) {
          var parentJobId;
          // find the job id based on the detector's description
          _.each(prlJobService.detectorsByJob, function(dtrs, jobId) {
            var descriptions = _.map(dtrs, function(dtr) {return dtr.detectorDescription;})
            if(_.indexOf(descriptions, lane) !== -1) {
              parentJobId = jobId;
            }
          });

          if(parentJobId !== undefined) {
            isBucketWidth = (prlJobService.basicJobs[parentJobId].bucketSpan === stepSecs);
          }
        }

        if(!INSPECTOR_MODE) {
          $lane.append($("<div>", {
            "class": "lane-label",
            "css": {
              "width": laneLabelWidth+"px"
            },
            "ng-class": "{ 'lane-label-expanded': showExpansion }",
            html: ((rowScope.expansionDirective)?"<span ng-click='expandRow()'><i class=\"fa discover-table-open-icon\" ng-class=\"{ 'fa-caret-down': showExpansion, 'fa-caret-right': !showExpansion }\"></i></span> ":"")+label
          }));
        }

        var $cellsContainer = $("<div>", {
          "class": "cells-container" + (INSPECTOR_MODE?" cells-container-inspector":"")
        });
        $lane.append($cellsContainer);

        // used to keep a reference to the hover functions for MONITOR swimlane
        // triggered by the event rate chart.
        rowScope.hoverFuncs = [];

        var time = startTime;
        for(var i=0;i<numBuckets;i++) {
          var $cell = $("<div>", {
            "class": "sl-cell "+(isBucketWidth?"sl-cell-lowest":""),
            css: {
              "width": cellWidth+"px"
            },
            "data-lane-label": lane,
            "data-time": time,

          });
          rowScope.lanes[lane].push($cell);

          var color = "none";
          var bucketScore = 0;
          for(var j=0; j<points.length; j++) {
            if(points[j].value > 0 && points[j].laneLabel === lane && points[j].time === time) { // this may break if detectors have the duplicate descriptions
              bucketScore = points[j];
              color = colorScore(bucketScore);
              $cell.append($("<div>", {
                "class": "sl-cell-inner",
                css: {
                  "background-color": color
                }
              }));
            }
          }

          $cell.attr({
            "ng-mouseover": "cellHover($event, '"+lane+"', "+bucketScore.value+", "+i+", "+time+", '"+rowScope.swimlaneType+"')",
            "ng-click": "cellClick($event, '"+lane+"', "+bucketScore.value+", "+i+", "+time+", '"+rowScope.swimlaneType+"')",
            "ng-mousedown": "startDrag($event, '"+lane+"', "+i+", "+time+", '"+rowScope.swimlaneType+"')",
          });
          $cellsContainer.append($cell);

          // for monitor swimlane, create a closure to lock in the hover settings for each cell.
          // triggered when hovering over the same timestamp in the eventrate chart
          if(SWIMLANE_TYPES[rowScope.swimlaneType] === SWIMLANE_TYPES.MONITOR) {
            rowScope.hoverFuncs[i] = function($event, lane, bucketScoreValue, i, time, swimlaneType) {
              return function(swimlaneTypeOverride) {
                cellHover($event, lane, bucketScoreValue, i, time, (swimlaneTypeOverride || swimlaneType));
              };
            }({currentTarget: $cell[0]}, lane, bucketScore.value, i, time, rowScope.swimlaneType);
          }

          time += stepSecs;
        }

        $swimlanes.append($lane);

        if(rowScope.expansionDirective) {

          var $laneExp = $("<div>", {
            "class": "lane-expansion",
            "ng-show": "showExpansion"
          });

          $laneExp.append($("<div>", {"class": "title", "text":"Detectors for "+label}));

          $laneExp.append($("<prl-summary-view-swimlane chart-data=\"detectorPerJobChartData['"+lane+"']\" swimlane-type='DETECTOR' selected-job-ids='selectedJobIds'  chart-width='chartWidth' container-id='swimlanes' expanded='true' style='width: 100%; height: 250px;'></prl-summary-view-swimlane>"));

          $swimlanes.append($laneExp);

          $compile($laneExp)(rowScope);
        }

        $compile($lane)(rowScope);
      });

      var $laneTimes = $("<div>", {
        "class": "time-tick-labels" + (INSPECTOR_MODE?" time-tick-labels-inspector":"")
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

      $swimlanes.append($laneTimes);
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
    // templateUrl: '/plugins/prelert/summaryview/detector_swimlane.html',
    template: "<div ng-show='chartTitle!==undefined' class='title'><i ng-click='toggleRow()' class='fa expand-arrow' ng-class=\"{ 'fa-caret-down': expanded, 'fa-caret-right': !expanded }\"> </i>{{chartTitle}}</div><div><div id='swimlanes' ng-show='expanded'></div></div>"
  };
})
.service("prlSwimlaneSelectionService", function($timeout, prlSwimlaneInspectorService, prlAnomalyRecordDetailsService) {
  var SWIMLANE_TYPES = prlAnomalyRecordDetailsService.type;

  var selection = {
      firstX: -1,
      offsetX: 0,
      secondX: -1,
      width: -1,
      active: false,
      startCell: null,
      endCell: null,
      startTime: 0,
      endTime: 0,
      interval: 0,
      laneLabel: "",
      swimlaneType: "",
      laneIndex: 0,
      isBackwards: false,
  };

  var $lane = null;
  var $highlight = $("<div>", {
    "class": "selection"
  });
  var cellWidth = 0;
  var $window = $(window);
  var SELECTION_WIDTH_MINIMUM = 5;

  function startDrag($event, laneLabel, index, time, swimlaneType) {

    // no dragging in the inspector
    if(SWIMLANE_TYPES[swimlaneType] === SWIMLANE_TYPES.INSPECTOR) {
      return;
    }

    document.body.focus();
    $highlight.remove();

    selection.startCell = getCell($event.target);
    selection.laneLabel = laneLabel;
    selection.swimlaneType = swimlaneType;
    selection.laneIndex = index;
    selection.endCell = null;

    cellWidth = selection.startCell.offsetWidth;

    $lane = $(selection.startCell.parentNode.parentNode);

    $window.one("mouseup", stopDrag);
    $lane.on("mousemove", mouseMove);

    selection.offsetX = $(".global-nav").width();

    selection.firstX = $event.clientX;
    // remove the offset caused by the kibana navigation menu
    selection.firstX -= selection.offsetX;

    $highlight.css({
      "left": selection.firstX +"px",
      "width": "0px"
    });

  }

  function stopDrag($event) {
    // console.log($event);
    // placed in a timeout to allow mouse click events to finish first
    $timeout(function() {
      prlSwimlaneInspectorService.hide();
      if(selection.active) {
        selection.endCell = selection.startCell;

        if(selection.isBackwards) {
          var numberOfCells = Math.floor( (selection.width + (cellWidth - (selection.firstX -  selection.startCell.offsetLeft )) )/cellWidth);
          for(var i=0;i<numberOfCells;i++) {
            if(selection.startCell.previousSibling) {
              selection.startCell = selection.startCell.previousSibling;
            }
          }
        } else {
          var numberOfCells = Math.floor( (selection.width + (selection.firstX -  selection.startCell.offsetLeft) )/cellWidth);
          for(var i=0;i<numberOfCells;i++) {
            if(selection.endCell.nextSibling) {
              selection.endCell = selection.endCell.nextSibling;
            }
          }
        }
        calculateTimeRange();

        if(!isNaN(selection.startTime) && !isNaN(selection.endTime) && !isNaN(selection.interval)) {
          var timeRange = {start: selection.startTime, end: selection.endTime, interval: selection.interval};

          prlSwimlaneInspectorService.show(timeRange, selection.laneLabel, $lane, $highlight, selection.swimlaneType, $lane.data("jobIds"));
          prlAnomalyRecordDetailsService.toggleLock();
          prlAnomalyRecordDetailsService.clearInspectorTopInfluencers();
        } else {
          $highlight.remove();
        }
      }

      selection.active = false;
      if($lane) {
        $lane.off("mousemove");
      }
      $lane = null;
    }, 0);
  }

  function mouseMove($event) {
    if(!selection.active && $lane) {
      selection.active = true;
      $lane.append($highlight);
    }

    selection.secondX = $event.clientX;
    // remove the offset caused by the kibana navigation menu
    selection.secondX -= selection.offsetX;

    // selecting backwards
    if(selection.secondX < selection.firstX) {
      selection.isBackwards = true;
      selection.width = selection.firstX - selection.secondX;

      $highlight.css({
        "left":  (selection.secondX) +"px",
        "width": (selection.width) + "px"
      });
    } else {
      selection.isBackwards = false;
      selection.width = selection.secondX - selection.firstX;
      $highlight.css("width", (selection.width)+"px");
    }

    // if the selection width is below the minimum, remove the selection and deactivate
    // this stop accidental single pixel selections made by moving the mouse slghtly when clicking
    if(selection.width < SELECTION_WIDTH_MINIMUM) {
      $highlight.remove();
      selection.active = false;
    }
  }

  function calculateTimeRange() {
    var interval = prlAnomalyRecordDetailsService.getBucketInterval().asSeconds();
    selection.interval = interval;

    selection.startTime = (+selection.startCell.dataset["time"]) ;
    selection.endTime = (+selection.endCell.dataset["time"]) + interval;
  }

  function getCell($target) {
    if($target.className === "sl-cell-inner") {
      return $target.parentNode;
    } else {
      return $target;
    }
  }

  function hide() {
    $highlight.remove();
  }

  this.startDrag = startDrag;
  this.stopDrag = stopDrag;
  this.selection = selection;
  this.hide = hide;
});
