/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
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
 * on +44 (0)20 7953 7243 or email to legal@prelert.com.    *
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

/**
 * Dropdown control for selecting which Prelert Engine API Anomaly Detective job to query.
 * The list of job IDs to display in the control are obtained via a REST query to the 
 * Prelert Engine API Jobs endpoint.
 */
define([
  'angular',
  'app',
  'config',
  'lodash'
],
function (angular, app, config, _) {
  'use strict';

  var module = angular.module('prelert.panels.prelertjobpicker', []);
  app.useModule(module);

  module.controller('prelertjobpicker', function($scope, alertSrv) {
    $scope.panelMeta = {
      status  : "Stable",
      description : "A dropdown control for selecting the Prelert Engine API job to query."
    };
    
    // Set and populate defaults
    var _d = {
      status        : "Stable",
      title         : "Job Picker",
      /**
       * label:: Label to show next to the job picker control.
       */
      label : 'Job ID:',
      /**
       * maxJobs:: The maximum number of jobs to show in the dropdown.
       */
      maxJobs    : 100 
    };
    _.defaults($scope.panel,_d);


    $scope.$on('refresh', function(){$scope.get_jobs();});

    $scope.init = function() {
        // Populate the dropdown with the list of jobs, obtained from the Engine API.
        $scope.job_ids = [];
        $scope.get_jobs();
    };
    
    $scope.get_jobs = function() {
        
        var params = {
                take: $scope.panel.maxJobs
            };
            $scope.prelertjs.JobsService.listJobs(params)
            .success(function(results) {
                
                var unsortedIds = _.map(results.documents, function(job) {
                   return job.id; 
                });
                
                $scope.job_ids = _.sortBy(unsortedIds, _.identity);
                
                var currentId = $scope.dashboard.current.index.default;
                
                // Default to the first job in the list if a current job is not set.
                if ( (_.isUndefined(currentId) || _.isEmpty(currentId)) &&  (_.size($scope.job_ids) > 0) ) {
                    $scope.setJobId(_.first($scope.job_ids));
                }
            })
            .error(function (error) {
                $scope.job_ids = [];
                
                alertSrv.set('Prelert Engine API Error',"Error obtaining the list of jobs from the Prelert Engine API at "+ config.prelertEngineAPIBaseURL +
                        ". Please ensure the Engine API is running and configured correctly." ,'error');
                console.log('Error loading list of jobs from the Prelert Engine API: ' + error); 
            });
    };

    $scope.setJobId = function(jobId) {
        
        if ($scope.dashboard.current.index.default != jobId) {
            $scope.dashboard.current.index.default = jobId;
            $scope.dashboard.refresh();
        }

    };

  });
});
