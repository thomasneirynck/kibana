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

import 'ui/sortable_column';

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkGetJobsPrivilege } from 'plugins/ml/privilege/check_privilege';

import template from './calendars_list.html';

uiRoutes
  .when('/settings/calendars_list', {
    template,
    resolve: {
      CheckLicense: checkLicense,
      privileges: checkGetJobsPrivilege
    }
  });

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml', ['ui.bootstrap']);

module.controller('MlCalendarsList',
  function (
    $scope,
    ml,
    timefilter,
    mlConfirmModalService) {

    timefilter.disableTimeRangeSelector(); // remove time picker from top of page
    timefilter.disableAutoRefreshSelector(); // remove time picker from top of page
    const mlConfirm = mlConfirmModalService;

    $scope.calendars = [];

    function loadCalendars() {
      ml.calendars()
        .then((resp) => {
          $scope.calendars = resp;
        });
    }

    $scope.allSelected = false;
    $scope.sortField = 'id';
    $scope.sortReverse = true;
    $scope.onSortChange = function (field, reverse) {
      $scope.sortField = field;
      $scope.sortReverse = reverse;
    };

    $scope.deleteCalendar = function (calendarId) {
      mlConfirm.open({
        message: `Confirm deletion of ${calendarId}?`,
        title: `Delete calendar`
      })
        .then(() => {
          ml.deleteCalendar({ calendarId })
            .then(loadCalendars)
            .catch((error) => {
              console.log(error);
            });
        })
        .catch(() => {});
    };

    loadCalendars();
  });
