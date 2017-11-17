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
 * Controller for the second step in the Create Job wizard, allowing
 * the user to select the type of job they wish to create.
 */

import uiRoutes from 'ui/routes';
import { checkLicenseExpired } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';
import template from './job_type.html';

uiRoutes
.when('/jobs/new_job/step/job_type', {
  template,
  resolve: {
    CheckLicense: checkLicenseExpired,
    privileges: checkCreateJobsPrivilege
  }
});


import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlNewJobStepJobType',
function (
  $scope,
  $route,
  timefilter) {

  timefilter.enabled = false; // remove time picker from top of page

  const indexPatternId = $route.current.params.index;
  const savedSearchId = $route.current.params.savedSearchId;

  $scope.getCreateSimpleJobUrl = function (basePath) {
    return indexPatternId !== undefined ? `${basePath}/create?index=${indexPatternId}` :
        `${basePath}/create?savedSearchId=${savedSearchId}`;
  };

  $scope.getCreateAdvancedJobUrl = function (basePath) {
    // TODO - use the supplied index pattern or saved search in the Advanced Job page.
    return indexPatternId !== undefined ? `${basePath}?index=${indexPatternId}` :
        `${basePath}?savedSearchId=${savedSearchId}`;
  };

});
