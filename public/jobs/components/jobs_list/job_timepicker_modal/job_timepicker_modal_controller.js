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

import _ from 'lodash';
import moment from 'moment-timezone';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlJobTimepickerModal', function ($scope, $modalInstance, params, prlJobService, prlMessageBarService) {
  var msgs = prlMessageBarService;
  // msgs.clear();
  $scope.saveLock = false;

  var job = angular.copy(params.job);
  $scope.jobId = job.id;

  $scope.start = "";
  $scope.end = "";

  var lastTime = "";
  if(job.counts && job.counts.latestRecordTimeStamp) {
    var time = moment(job.counts.latestRecordTimeStamp);
    lastTime= time.format("YYYY-MM-DD HH:mm:ss");
  }

  var uiEndRadio = "0";
  var uiTo = "";
  $scope.isNew = true;
  if(job.counts && job.counts.inputRecordCount > 0) {
    $scope.isNew = false;

    // if the job previously had an end time set. default to that.
    if(params.startEnd.endTimeMillis !== null) {
      uiEndRadio = "1";
      uiTo = moment(params.startEnd.endTimeMillis);
    }
  }


  $scope.ui = {
    lastTime: lastTime,
    startDateText: "",
    startRadio:    "1",
    endDateText:   "",
    endRadio:      uiEndRadio,
    timepicker: {
      from: "",
      to:   uiTo
    },
    setStartRadio: function(i) {
      $scope.ui.startRadio = i;
    },
  };

  function extractForm() {
    if($scope.ui.startRadio === "0") {
      $scope.start = "now";
    }
    else if($scope.ui.startRadio === "1") {
      $scope.start = "";
    }
    else if($scope.ui.startRadio === "2") {
      $scope.start = moment($scope.ui.timepicker.from).unix();
    }

    if($scope.ui.endRadio === "0") {
      $scope.end = "";
    } else if($scope.ui.endRadio === "1") {
      $scope.end = moment($scope.ui.timepicker.to).unix();
    }
  }

  $scope.save = function() {
    $scope.saveLock = true;

    extractForm();

    var params = {
      start: $scope.start,
      end: $scope.end,
    };

    prlJobService.startScheduler($scope.jobId, params)
      .then(function(resp) {
        prlJobService.refreshJob($scope.jobId)
          .then(function(job) {
            // no need to do anything. the job service broadcasts a jobs list update event
          })
          .catch(function(job){});
        $modalInstance.close();
      })
      .catch(function(resp) {
        $scope.saveLock = false;
        msgs.error(resp.message);
      });
  };

  $scope.cancel = function() {
    // msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
