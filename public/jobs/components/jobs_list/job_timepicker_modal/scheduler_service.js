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

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlSchedulerService', function ($modal, prlJobService) {

  function loadStartEnd(jobId) {
    return prlJobService.jobSchedulerState(jobId);
  }

  this.openJobTimepickerWindow = function (job) {
    function func(obj) {
      const modalInstance = $modal.open({
        template: require('plugins/prelert/jobs/components/jobs_list/job_timepicker_modal/job_timepicker_modal.html'),
        controller: 'PrlJobTimepickerModal',
        backdrop: 'static',
        keyboard: false,
        // size: 'lg',
        resolve: {
          params: function () {
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

});
