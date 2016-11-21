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

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlSchedulerService', ['$modal', 'prlJobService', function($modal, prlJobService) {

  function loadStartEnd(jobId) {
    return prlJobService.jobSchedulerState(jobId);
  }

  this.openJobTimepickerWindow = function(job) {
    function func(obj) {
      var modalInstance = $modal.open({
        template: require('plugins/prelert/jobs/components/jobs_list/job_timepicker_modal/job_timepicker_modal.html'),
        controller: 'PrlJobTimepickerModal',
        backdrop: "static",
        keyboard: false,
        // size: "lg",
        resolve: {
          params: function() {
            return {
              job: job,
              startEnd: obj,
            };
          }
        }
      });
    }
    // before we display the modal, load the scheduler state to see
    // if an end time was previously set
    loadStartEnd(job.id).then(func).catch(func);
  };

}]);
