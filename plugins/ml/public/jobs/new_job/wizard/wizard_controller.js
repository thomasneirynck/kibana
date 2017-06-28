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

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';

uiRoutes
.when('/jobs/new_job', {
  template: require('./wizard.html'),
  resolve : {
    CheckLicense: checkLicense,
    privileges: checkCreateJobsPrivilege,
    indexPatternIds: courier => courier.indexPatterns.getIds()
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlNewJobWizard',
function (
  $scope,
  $route,
  $location,
  timefilter) {


  timefilter.enabled = false; // remove time picker from top of page

  $scope.ui = {
    pageTitle: 'Create a new job',
    wizard: {
      step: 0,
      forward: function () {
        wizardStep(1);
      },
      back: function () {
        wizardStep(-1);
      }
    }
  };

  function wizardStep(step) {
    $scope.ui.wizard.step += step;
  }

});
