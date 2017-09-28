/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright © 2017 Elasticsearch BV. All Rights Reserved.
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

import 'ui/courier';
import 'plugins/kibana/visualize/styles/main.less';
import 'plugins/kibana/visualize/wizard/wizard.less';

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';
import { getIndexPatterns } from 'plugins/ml/util/index_utils';
import step1Template from './step_1.html';

uiRoutes
.when('/jobs/new_job/simple/population/step/1', {
  template: step1Template,
  resolve: {
    CheckLicense: checkLicense,
    privileges: checkCreateJobsPrivilege,
    indexPatterns: getIndexPatterns
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlNewJobPopulationStep1', function ($scope, $route, timefilter) {

  timefilter.enabled = false; // remove time picker from top of page.

  $scope.indexPattern = {
    selection: null,
    list: $route.current.locals.indexPatterns
  };

  $scope.step2WithSearchUrl = (hit) => {
    return '#/jobs/new_job/simple/population/create?savedSearchId=' + encodeURIComponent(hit.id);
  };
  $scope.makeUrl = (pattern) => {
    if (!pattern) return;
    return '#/jobs/new_job/simple/population/create?index=' + encodeURIComponent(pattern.id);
  };
});
