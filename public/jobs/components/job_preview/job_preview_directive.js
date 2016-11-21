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

import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobPreview', ['prlMessageBarService', 'prlJobService', function(prlMessageBarService, prlJobService) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template: require('plugins/prelert/jobs/components/job_preview/job_preview.html'),
    link: function(scope, element, attrs) {
      scope.job = prlJobService.removeJobEndpoints(prlJobService.getJob(attrs.prlJobId));
      // make the delimiter user readable
      if(scope.job.dataDescription && scope.job.dataDescription.format === "DELIMITED") {
        scope.job.dataDescription.fieldDelimiter = scope.formatDelimiter(scope.job.dataDescription.fieldDelimiter);
      }
    }
  };
}])

.directive('prlJobItem', function() {
  return {
    replace: true,
    restrict: 'EA',
  };
})

// add the job preview template to the template cache so there's no delay in displaying it
// which can cause positioning mistakes
.run(function($templateRequest) {
  $templateRequest(chrome.getBasePath() + '/plugins/prelert/jobs/components/job_preview/job_preview.html', true);
});

