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

import 'plugins/ml/settings/special_events/components/new_event_modal';

import template from './events_list.html';
import moment from 'moment';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlEventsList', function (mlNewEventService) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template,
    scope: {
      events: '=',
    },
    controller: function ($scope) {

      const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

      $scope.clickNewEvent = function () {
        mlNewEventService.openNewEventWindow()
          .then((event) => {
            console.log(event);
            $scope.events.push(event);
          })
          .catch(() => {});
      };

      $scope.formatTime = function (timeMs) {
        const time = moment(timeMs);
        return time.format(TIME_FORMAT);
      };

      $scope.deleteEvent = function (index) {
        $scope.events.splice(index, 1);
      };


    }
  };
});
