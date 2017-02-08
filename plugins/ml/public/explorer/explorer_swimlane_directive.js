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
 * AngularJS directive for rendering Explorer dashboard swimlanes.
 */

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';

import anomalyUtils from 'plugins/ml/util/anomaly_utils';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlExplorerSwimlane', function ($compile, mlExplorerDashboardService) {

  function link(scope, element) {

    scope.$on('render',function () {
      render();
    });

    element.on('$destroy', function () {
      scope.$destroy();
    });

    if (scope.swimlaneData !== undefined) {
      // render();
    }

    function render() {
      if (scope.swimlaneData === undefined) {
        return;
      }
      console.log('swimlane_directive swimlaneData:', scope.swimlaneData);

      const lanes = scope.swimlaneData.laneLabels;
      const startTime = scope.swimlaneData.earliest;
      const endTime = scope.swimlaneData.latest;
      const stepSecs = scope.swimlaneData.interval;
      const points = scope.swimlaneData.points;

      function colorScore(d) {
        return anomalyUtils.getSeverityColor(d.value);
      }

      const numBuckets = parseInt((endTime - startTime) / stepSecs);
      const cellHeight = 30;
      const height = (lanes.length + 1) * cellHeight - 10;
      const laneLabelWidth = 170;

      element.css('height', (height + 20) + 'px');
      const $swimlanes = element.find('#swimlanes');
      $swimlanes.empty();

      const cellWidth = Math.floor(scope.chartWidth / numBuckets);
      let cellsPerTick = 1;
      if (cellWidth < 100) {
        const numTickLabels = scope.chartWidth / 100;
        cellsPerTick = Math.max(Math.floor(numBuckets / numTickLabels), 2);
      }

      const timeTickLabels = [];
      for (let i = 0; i < numBuckets; i += cellsPerTick) {
        timeTickLabels.push(moment.unix(startTime + (i * stepSecs)).format('MMM DD HH:mm'));
      }

      function cellClick($event, laneLabel, bucketScore, index, time) {

        let $target = $($event.target);
        // if the edge of the outer cell has been clicked by accident, find the inner cell.
        if ($target.hasClass('sl-cell')) {
          $target = $target.find('.sl-cell-inner');
        }
        if ($target) {
          $('.lane-label', '.ml-explorer-swimlane').addClass('lane-label-masked');
          $('.sl-cell-inner', '.ml-explorer-swimlane').addClass('sl-cell-inner-masked');

          $target.removeClass('sl-cell-inner-masked');

          $('.lane-label').filter(function () {
            return $(this).text() === laneLabel;
          }).removeClass('lane-label-masked');

          console.log('swimlane cellClick t:', time);
          mlExplorerDashboardService.fireSwimlaneCellClick({
            fieldName: scope.swimlaneData.fieldName,
            laneLabel: laneLabel,
            time: time,
            interval: scope.swimlaneData.interval,
            score: bucketScore
          });
        }
      }

      scope.lanes = scope.$parent.lanes;

      _.each(lanes, function (lane) {
        const rowScope = scope.$new();
        scope.$parent.lanes[lane] = [];

        rowScope.cellClick = cellClick;

        rowScope.selectedJobIds = [lane];

        const $lane = $('<div>', {
          'class': 'lane',
        })
        .data('jobIds', scope.selectedJobIds);

        const label = lane;
        $lane.append($('<div>', {
          'class': 'lane-label',
          'css': {
            'width': laneLabelWidth + 'px'
          },
          html: label
        }));

        const $cellsContainer = $('<div>', {
          'class': 'cells-container'
        });
        $lane.append($cellsContainer);

        // TODO - mark if zoomed in to bucket width?
        let time = startTime;
        for (let i = 0; i < numBuckets; i++) {
          const $cell = $('<div>', {
            'class': 'sl-cell ',
            css: {
              'width': cellWidth + 'px'
            },
            'data-lane-label': lane,
            'data-time': time,

          });
          rowScope.lanes[lane].push($cell);

          let color = 'none';
          let bucketScore = 0;
          for (let j = 0; j < points.length; j++) {

            if (points[j].value > 0 && points[j].laneLabel === lane && points[j].time === time) { // this may break if detectors have the duplicate descriptions
              bucketScore = points[j];
              color = colorScore(bucketScore);
              $cell.append($('<div>', {
                'class': 'sl-cell-inner',
                css: {
                  'background-color': color
                }
              }));
            }
          }

          let cellHoverTxt = 'cellHover($event, \'' + lane + '\', ';
          cellHoverTxt += bucketScore.value + ', ' + i + ', ' + time + ', \'' + rowScope.swimlaneType + '\')';
          let cellClickTxt = 'cellClick($event, \'' + lane + '\', ';
          cellClickTxt += bucketScore.value + ', ' + i + ', ' + time + ', \'' + rowScope.swimlaneType + '\')';
          let startDragTxt = 'startDrag($event, \'' + lane + '\', ';
          startDragTxt += i + ', ' + time + ', \'' + rowScope.swimlaneType + '\')';

          $cell.attr({
            'ng-mouseover': cellHoverTxt,
            'ng-click': cellClickTxt,
            'ng-mousedown': startDragTxt,
          });
          $cellsContainer.append($cell);

          time += stepSecs;
        }

        $swimlanes.append($lane);

        $compile($lane)(rowScope);
      });

      const $laneTimes = $('<div>', {
        'class': 'time-tick-labels'
      });
      _.each(timeTickLabels, function (label, i) {
        $laneTimes.append($('<span>', {
          'class': 'tick-label',
          'text': label,
          'css': {
            'margin-left': (i * cellWidth * cellsPerTick) + 'px'
          }
        }));
      });

      $swimlanes.append($laneTimes);
    }
  }

  const template = '<div id=\'swimlanes\'></div>';
  return {
    scope: {
      swimlaneData: '=',
      containerId: '@',
      selectedJobIds: '=',
      chartWidth: '='
    },
    link: link,
    template: template
  };
});