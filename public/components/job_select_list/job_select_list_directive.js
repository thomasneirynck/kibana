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

/*
 * prl-job-select-list directive for rendering a multi-select control for selecting
 * one or more jobs from the list of configured jobs.
 */

import _ from 'lodash';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlJobSelectList', ['prlJobService', 'prlDashboardService', function(prlJobService, prlDashboardService) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template: require('plugins/prelert/components/job_select_list/job_select_list.html'),
    controller: function($scope, prlJobService) {

      prlJobService.getBasicJobInfo('prelertresults-*')
        .then(function(resp) {
          if (resp.jobs.length > 0) {
            var jobs = [];
            _.each(resp.jobs, function(job){
                jobs.push({id:job.id});
            });
            $scope.jobs = jobs;

            if ($scope.selections.length === 1 && $scope.selections[0] === '*') {
                // Replace the '*' selection with the complete list of job IDs.
                $scope.selections = _.map($scope.jobs, function(job){ return job.id; });
            }
          }
        }).catch(function(resp) {
          console.log("prlJobSelectList controller - error getting job info from ES:", resp);
        });

      $scope.apply = function() {
        if ($scope.selections.length == $scope.jobs.length) {
            prlDashboardService.broadcastJobSelectionChange(['*']);
        } else {
            prlDashboardService.broadcastJobSelectionChange($scope.selections);
        }
        $scope.closePopover();
      };

      $scope.toggleSelection = function(jobId) {
        var idx = $scope.selections.indexOf(jobId);
        if (idx > -1) {
          $scope.selections.splice(idx, 1);
        } else {
          $scope.selections.push(jobId);
        }
      };

      $scope.isSelected = function(jobId) {
         return (_.contains($scope.selections, jobId) || ($scope.selections.length == 1 && $scope.selections[0] === '*'));
      };

    },
    link: function(scope, element, attrs) {
      // List of jobs to select is passed to the directive in the 'selected' attribute.
      // '*' is passed to indicate 'All jobs'.
      scope.selections = (attrs.selected ? attrs.selected.split(' ') : []);

      scope.selectAll = function() {
        $("input:checkbox", element).prop('checked', true);
        scope.selections = _.map(scope.jobs, function(job){ return job.id; });
      };

      scope.unselectAll = function() {
        $("input:checkbox", element).prop('checked', false);
        scope.selections = [];
      };

      // Giving the parent div focus fixes checkbox tick UI selection on IE.
      $('.prl-select-list', element).focus();
    }
  };
}])

// Add the job select template to the template cache so there's no delay in displaying it
// which can cause positioning mistakes.
.run(function($templateRequest) {
  // $templateRequest('/plugins/prelert/components/job_select_list/job_select_list.html', true);
});

