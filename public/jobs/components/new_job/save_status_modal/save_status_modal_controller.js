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
import stringUtils from 'plugins/prelert/util/string_utils';
import "./styles/main.less";

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlSaveStatusModal', function ($scope, $location, $modalInstance, params) {

  $scope.pscope = params.pscope;
  $scope.ui = {
    showUploadStatus: params.showUploadStatus,
    showTimepicker: false,
  };

  // return to jobs list page and open the scheduler modal for the new job
  $scope.openScheduler = function() {
    $location.path("jobs");
    $modalInstance.close();
    params.openScheduler();
  };

  // once the job is saved and optional upload is complete.
  // close modal and return to jobs list
  $scope.close = function() {
    if($scope.pscope.ui.saveStatus.job === 2 &&
      ($scope.ui.showUploadStatus === false ||
      ($scope.ui.showUploadStatus === true && $scope.pscope.ui.saveStatus.upload === 2) ) ) {
      $location.path("jobs");
    }

    $scope.pscope.ui.saveStatus.job = 0;
    $scope.pscope.ui.saveStatus.upload = 0;
    $modalInstance.dismiss('cancel');
  };

});
