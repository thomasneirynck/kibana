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

 // a copy of kibanan's pretty duration directive
 // adding new buttons around the timepicker.


import _ from 'lodash';
import dateMath from '@elastic/datemath';
import moment from 'moment';

import 'ui/timepicker/quick_ranges';
import 'ui/timepicker/time_units';
import './styles/main.less';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prettyDuration', function (config, quickRanges, timeUnits, $compile, timefilter) {
  return {
    restrict: 'E',
    priority: 1,
    terminal: true,
    scope: {
      from: '=',
      to: '='
    },
    link: function ($scope, $elem) {
      var dateFormat = config.get('dateFormat');

      var lookupByRange = {};
      _.each(quickRanges, function (frame) {
        lookupByRange[frame.from + ' to ' + frame.to] = frame;
      });

      function stringify() {
        var text;
        // If both parts are date math, try to look up a reasonable string
        if ($scope.from && $scope.to && !moment.isMoment($scope.from) && !moment.isMoment($scope.to)) {
          var tryLookup = lookupByRange[$scope.from.toString() + ' to ' + $scope.to.toString()];
          if (tryLookup) {
            $elem.text(tryLookup.display);
          } else {
            var fromParts = $scope.from.toString().split('-');
            if ($scope.to.toString() === 'now' && fromParts[0] === 'now' && fromParts[1]) {
              var rounded = fromParts[1].split('/');
              text = 'Last ' + rounded[0];
              if (rounded[1]) {
                text = text + ' rounded to the ' + timeUnits[rounded[1]];
              }
              $elem.text(text);
            } else {
              cantLookup();
            }
          }
        // If at least one part is a moment, try to make pretty strings by parsing date math
        } else {
          cantLookup();
        }
      };

      function cantLookup() {
        var display = {};
        _.each(['from', 'to'], function (time) {
          if (moment.isMoment($scope[time])) {
            display[time] = $scope[time].format(dateFormat);
          } else {
            if ($scope[time] === 'now') {
              display[time] = 'now';
            } else {
              var tryParse = dateMath.parse($scope[time], time === 'to' ? true : false);
              display[time] = moment.isMoment(tryParse) ? '~ ' + tryParse.fromNow() : $scope[time];
            }
          }
        });
        $elem.text(display.from + ' to ' + display.to);
      };

      // add the arrow elements to the page outside the <pretty_duration>'s parent anchor element
      // however, they are given <pretty_duration>'s scope to allow access to the back and forward functions
      function addArrows() {
        $elem.parent().css("display", "inline-block");
        var fwdButton = angular.element("<i ng-click='foward()' class='prl-time-button fa fa-arrow-right' ></i>");
        var backButton = angular.element("<i ng-click='back()' class='prl-time-button fa fa-arrow-left' ></i>");
        var zoomOutButton = angular.element("<i ng-click='zoomOut()' class='prl-time-button fa fa-search-minus' ></i>");
        var zoomInButton = angular.element("<i ng-click='zoomIn()' class='prl-time-button fa fa-search-plus' ></i>");
        var separator = angular.element("<div class='prl-time-button-separator' ></div>");

        $elem.parent().before(zoomInButton);
        $elem.parent().before(zoomOutButton);
        $elem.parent().before(separator);
        $elem.parent().before(backButton);
        $elem.parent().after(fwdButton);
        // compile the new html and attach this scope to allow access to the back and forward functions
        $compile(zoomInButton)($scope);
        $compile(zoomOutButton)($scope);
        $compile(backButton)($scope);
        $compile(fwdButton)($scope);
      }

      // find the from and to values from the timefilter
      // if a quick or relative mode has been selected, work out the
      // absolute times and then change the mode to absolute
      function getFromTo() {
        if(timefilter.time.mode === "absolute") {
          return {
            to:   moment(timefilter.time.to),
            from: moment(timefilter.time.from)
          }
        } else {
          timefilter.time.mode = "absolute";
          return {
            to:   dateMath.parse(timefilter.time.to, true),
            from: dateMath.parse(timefilter.time.from)
          }
        }
      }

      // travel forward in time based on the interval between from and to
      $scope.foward = function() {
        var time = getFromTo();
        var diff = time.to.diff(time.from);
        var origTo = time.to.toISOString();

        time.to.add(diff, "milliseconds");
        timefilter.time.from = origTo;
        timefilter.time.to = time.to.toISOString();
      };

      // travel backwards in time based on the interval between from and to
      $scope.back = function() {
        var time = getFromTo();
        var diff = time.to.diff(time.from);
        var origFrom = time.from.toISOString();

        time.from.subtract(diff, "milliseconds");
        timefilter.time.to = origFrom;
        timefilter.time.from = time.from.toISOString();
      };

      // zoom out, doubling the difference between start and end, keeping the same time range center
      $scope.zoomOut = function() {
        var time = getFromTo();
        var from = time.from.unix() * 1000;
        var to = time.to.unix() * 1000;

        var diff = Math.floor((to - from) / 2);

        timefilter.time.from = moment(from - diff).toISOString();
        timefilter.time.to = moment(to + diff).toISOString();
      };

      // zoom in, halving the difference between start and end, keeping the same time range center
      $scope.zoomIn = function() {
        var time = getFromTo();
        var from = time.from.unix() * 1000;
        var to = time.to.unix() * 1000;

        var diff = Math.floor((to - from) / 4);

        timefilter.time.from = moment(from + diff).toISOString();
        timefilter.time.to = moment(to - diff).toISOString();
      };

      $scope.$watch('from', stringify);
      $scope.$watch('to', stringify);

      addArrows();
    }
  };
});

