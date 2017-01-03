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

import _ from 'lodash';
import moment from 'moment-timezone';
import stringUtils from 'plugins/prelert/util/string_utils';
import angular from 'angular';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlJobTimepickerModal', function ($scope, $modalInstance, params, prlJobService, prlMessageBarService) {
  const msgs = prlMessageBarService;
  // msgs.clear();
  $scope.saveLock = false;

  const job = angular.copy(params.job);
  $scope.jobId = job.job_id;
  $scope.schedulerId = 'scheduler-' + job.job_id;

  $scope.start = '';
  $scope.end = '';

  let lastTime = '';
  if (job.data_counts && job.data_counts.latest_record_timestamp) {
    const time = moment(job.data_counts.latest_record_timestamp);
    lastTime = time.format('YYYY-MM-DD HH:mm:ss');
  }

  let uiEndRadio = '1';
  let uiTo = moment();
  $scope.isNew = true;
  if (job.data_counts && job.data_counts.input_record_count > 0) {
    $scope.isNew = false;

    // if the job previously had an end time set. default to that.
    if (params.startEnd.endTimeMillis !== null) {
      uiEndRadio = '1';
      uiTo = moment(params.startEnd.endTimeMillis);
    }
  }


  $scope.ui = {
    lastTime: lastTime,
    startDateText: '',
    startRadio:    '1',
    endDateText:   '',
    endRadio:      uiEndRadio,
    timepicker: {
      from: '',
      to:   uiTo
    },
    setStartRadio: function (i) {
      $scope.ui.startRadio = i;
    },
  };

  function extractForm() {
    if ($scope.ui.startRadio === '0') {
      $scope.start = 'now';
    }
    else if ($scope.ui.startRadio === '1') {
      $scope.start = '0';
    }
    else if ($scope.ui.startRadio === '2') {
      $scope.start = moment($scope.ui.timepicker.from).unix() * 1000;
    }

    if ($scope.ui.endRadio === '0') {
      $scope.end = '';
    } else if ($scope.ui.endRadio === '1') {
      $scope.end = moment($scope.ui.timepicker.to).unix() * 1000;
    }
  }

  $scope.save = function () {
    $scope.saveLock = true;

    extractForm();

    prlJobService.startScheduler($scope.schedulerId, $scope.jobId, $scope.start, $scope.end)
      .then((resp) => {
        prlJobService.refreshJob($scope.jobId)
          .then((job) => {
            // no need to do anything. the job service broadcasts a jobs list update event
          })
          .catch((job) => {});
        $modalInstance.close();
      })
      .catch((resp) => {
        $scope.saveLock = false;
        msgs.error(resp.message);
      });
  };

  $scope.cancel = function () {
    // msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
