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

    // Re-render the swimlane whenever the underlying data changes.
    mlExplorerDashboardService.addSwimlaneDataChangeListener((swimlaneType) => {
      if (swimlaneType === scope.swimlaneType) {
        render();
      }
    });

    element.on('$destroy', function () {
      scope.$destroy();
    });

    function render() {
      if (scope.swimlaneData === undefined) {
        return;
      }

      const lanes = scope.swimlaneData.laneLabels;
      const startTime = scope.swimlaneData.earliest;
      const endTime = scope.swimlaneData.latest;
      const stepSecs = scope.swimlaneData.interval;
      const points = scope.swimlaneData.points;

      function colorScore(value) {
        return anomalyUtils.getSeverityColor(value);
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

      // Clear selection if clicking away from a cell.
      $swimlanes.click(function ($event) {
        const $target = $($event.target);
        if (!$target.hasClass('sl-cell') && !$target.hasClass('sl-cell-inner') &&
            $('.sl-cell-inner.sl-cell-inner-selected', '.ml-explorer-swimlane').length > 0) {
          clearSelection();
        }
      });

      function cellClick($event, laneLabel, bucketScore, index, time) {

        let $target = $($event.target);
        // if the edge of the outer cell has been clicked by accident, find the inner cell.
        if ($target.hasClass('sl-cell')) {
          $target = $target.find('.sl-cell-inner');
        }
        if ($target && bucketScore > 0) {
          $('.lane-label', '.ml-explorer-swimlane').addClass('lane-label-masked');
          $('.sl-cell-inner', '.ml-explorer-swimlane').addClass('sl-cell-inner-masked');
          $('.sl-cell-inner.sl-cell-inner-selected', '.ml-explorer-swimlane').removeClass('sl-cell-inner-selected');

          $target.removeClass('sl-cell-inner-masked');
          $target.addClass('sl-cell-inner-selected');

          $('.lane-label').filter(function () {
            return $(this).text() === laneLabel;
          }).removeClass('lane-label-masked');

          mlExplorerDashboardService.fireSwimlaneCellClick({
            fieldName: scope.swimlaneData.fieldName,
            laneLabel: laneLabel,
            time: time,
            interval: scope.swimlaneData.interval,
            score: bucketScore
          });
        } else {
          clearSelection();
        }
      }

      function cellMouseover($event, laneLabel, bucketScore, index, time) {
        if (bucketScore === undefined) {
          return;
        }

        const displayScore = (bucketScore > 1 ? parseInt(bucketScore) : '< 1');

        // Display date using same format as Kibana visualizations.
        const formattedDate = moment(time * 1000).format('MMMM Do YYYY, HH:mm');
        let contents = formattedDate + '<br/><hr/>';
        if (scope.swimlaneData.fieldName !== undefined) {
          contents += scope.swimlaneData.fieldName + ': ' + laneLabel + '<br/><hr/>';
        }
        contents += ('Max anomaly score: ' + displayScore);

        const x = $event.pageX;
        const y = $event.pageY;
        const offset = 5;
        $('<div class="ml-explorer-swimlane-tooltip ml-explorer-tooltip">' + contents + '</div>').css({
          'position': 'absolute',
          'display': 'none',
          'z-index': 1,
          'top': y + offset,
          'left': x + offset
        }).appendTo('body').fadeIn(200);

        // Position the tooltip.
        const $win = $(window);
        const winHeight = $win.height();
        const yOffset = window.pageYOffset;
        const tooltipWidth = $('.ml-explorer-swimlane-tooltip').outerWidth(true);
        const tooltipHeight = $('.ml-explorer-swimlane-tooltip').outerHeight(true);

        $('.ml-explorer-swimlane-tooltip').css('left', x + offset + tooltipWidth > $win.width() ? x - offset - tooltipWidth : x + offset);
        $('.ml-explorer-swimlane-tooltip').css('top', y + tooltipHeight < winHeight + yOffset ? y : y - tooltipHeight);
      }

      function cellMouseleave() {
        $('.ml-explorer-swimlane-tooltip').remove();
      }

      function clearSelection() {
        $('.lane-label', '.ml-explorer-swimlane').removeClass('lane-label-masked');
        $('.sl-cell-inner', '.ml-explorer-swimlane').removeClass('sl-cell-inner-masked');
        $('.sl-cell-inner.sl-cell-inner-selected', '.ml-explorer-swimlane').removeClass('sl-cell-inner-selected');
        mlExplorerDashboardService.fireSwimlaneCellClick({});
      }

      //scope.lanes = scope.$parent.lanes;

      _.each(lanes, function (lane) {
        const rowScope = scope.$new();
        //scope.$parent.lanes[lane] = [];

        rowScope.cellClick = cellClick;
        rowScope.cellMouseover = cellMouseover;
        rowScope.cellMouseleave = cellMouseleave;

        const $lane = $('<div>', {
          'class': 'lane',
        });

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
          //rowScope.lanes[lane].push($cell);

          let color = 'none';
          let bucketScore = 0;
          for (let j = 0; j < points.length; j++) {

            if (points[j].value > 0 && points[j].laneLabel === lane && points[j].time === time) { // this may break if detectors have the duplicate descriptions
              bucketScore = points[j].value;
              color = colorScore(bucketScore);
              $cell.append($('<div>', {
                'class': 'sl-cell-inner',
                css: {
                  'background-color': color
                }
              }));
            }
          }

          const cellClickTxt = 'cellClick($event, \'' + lane + '\', ' + bucketScore + ', ' + i + ', ' + time + ')';
          $cell.attr({ 'ng-click': cellClickTxt });

          if (bucketScore > 0) {
            const cellMouseoverTxt = 'cellMouseover($event, \'' + lane + '\', ' + bucketScore + ', ' + i + ', ' + time + ')';
            const cellMouseleaveTxt = 'cellMouseleave()';
            $cell.attr({
              'ng-mouseover': cellMouseoverTxt,
              'ng-mouseleave': cellMouseleaveTxt
            });
          }

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
      swimlaneType: '@',
      swimlaneData: '=',
      selectedJobIds: '=',
      chartWidth: '='
    },
    link: link,
    template: template
  };
});