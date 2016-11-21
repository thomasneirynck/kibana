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
import 'plugins/prelert/jobs/components/new_job/detectors_list_directive';
import "./styles/main.less";

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlEditJobModal', function ($scope, $modalInstance, $modal, params, prlJobService, prlMessageBarService) {
  var msgs = prlMessageBarService;
  msgs.clear();
  $scope.saveLock = false;
  $scope.pscope = params.pscope;
  $scope.job = angular.copy(params.job);

  $scope.ui = {
    title: "Edit "+ $scope.job.id,
    currentTab: 0,
    tabs: [
      { index: 0, title: "Job Details", hidden: false },
      { index: 1, title: "Scheduler", hidden: true },
      { index: 2, title: "Detectors", hidden: false },
    ],
    changeTab: function(tab) {
      $scope.ui.currentTab = tab.index;
    },
    isScheduled: false,
    schedulerStopped: false,
    scheduler: {
      scrollSizeDefault: 1000,
    },
    stoppingScheduler: false,
    passwordPlaceholder: "",
    validation: {
      tabs:[
        {index: 0, valid: true, checks: { categorizationFilters: {valid: true} }}
      ]
    }
  };

  // extract scheduler settings
  if($scope.job.schedulerConfig) {
    var schedulerConfig = $scope.job.schedulerConfig;
    $scope.ui.isScheduled = true;
    $scope.ui.tabs[1].hidden = false;
    $scope.ui.schedulerStopped = (!$scope.job.schedulerStatus || $scope.job.schedulerStatus === "STOPPED");

    $scope.ui.scheduler.queryText = angular.toJson(schedulerConfig.query, true);
    $scope.ui.scheduler.scrollSizeText = schedulerConfig.scrollSize;

    $scope.ui.scheduler.serverAuthenticated = (schedulerConfig.username && schedulerConfig.username !== "");

    if($scope.ui.scheduler.serverAuthenticated) {
      $scope.ui.scheduler.usernameText = schedulerConfig.username;
      $scope.ui.scheduler.passwordText = "";

      $scope.ui.scheduler.passwordPlaceholder = "The password for this job needs to be entered again, even if it has not changed.";

      delete $scope.job.schedulerConfig.encryptedPassword;
    }
  }

  $scope.addCustomUrl = function() {
    if(!$scope.job.customSettings) {
      $scope.job.customSettings = {};
    }
    if(!$scope.job.customSettings.customUrls) {
      $scope.job.customSettings.customUrls = [];
    }

    $scope.job.customSettings.customUrls.push({ urlName: "", urlValue: "" });
  };

  $scope.removeCustomUrl = function(index) {
    $scope.job.customSettings.customUrls.splice(index, 1);
  };

  // add new categorization filter
  $scope.addCategorizationFilter = function() {
    if($scope.job.analysisConfig) {
      if(!$scope.job.analysisConfig.categorizationFilters) {
          $scope.job.analysisConfig.categorizationFilters = [];
      }

      $scope.job.analysisConfig.categorizationFilters.push("");
    }
  };

  // remove selected categorization filter
  $scope.removeCategorizationFilter = function(index) {
    if($scope.job.analysisConfig && $scope.job.analysisConfig.categorizationFilters) {
      $scope.job.analysisConfig.categorizationFilters.splice(index, 1);
    }
  };

  // convenient function to stop the scheduler from inside the edit dialog
  $scope.stopScheduler = function() {
    $scope.ui.stoppingScheduler = true;
    prlJobService.stopScheduler($scope.job.id)
      .then(function(resp) {
        if(resp.acknowledgement && resp.acknowledgement === true) {
          $scope.ui.schedulerStopped = true;
        }
      });
  };

  function validateJob() {
    var valid = true;
    var tabs = $scope.ui.validation.tabs;
    // reset validations
    _.each(tabs, function(tab) {
      tab.valid = true;
        for(var check in tab.checks) {
          tab.checks[check].valid = true;
          tab.checks[check].message = "";
        }
    });

    if($scope.job.analysisConfig.categorizationFilters ) {
      var v = true;
      _.each($scope.job.analysisConfig.categorizationFilters, function(d) {
        try {
          new RegExp(d);
        } catch(e) {
          v = false;
        }

        if( d === "" || v === false) {
          tabs[0].checks.categorizationFilters.valid = false;
          valid = false;
        }
      });
    }
    return valid;
  }

  $scope.save = function() {
    msgs.clear();

    if(!validateJob()) {
      return;
    }

    $scope.saveLock = true;

    var jobId = $scope.job.id;
    var data = {};

    // if the job description has changed, add it to the data json
    if($scope.job.description !== params.job.description) {
      data.description = $scope.job.description;
    }

    // check each detector. if the description or filters have changed, add it to the data json
    _.each($scope.job.analysisConfig.detectors, function(d, i) {
      var changes = 0;

      var obj = {
        index: i,
      };

      if(d.detectorDescription !== params.job.analysisConfig.detectors[i].detectorDescription) {
        obj.description = d.detectorDescription;
        changes++;
      }

      if(d.detectorRules !== params.job.analysisConfig.detectors[i].detectorRules) {
        obj.detectorRules = d.detectorRules;
        changes++;
      }

      if(changes > 0) {
        if(data.detectors === undefined) {
          data.detectors = [];
        }
        data.detectors.push(obj);
      }
    });

    // check each categorization filter. if any have changed, add all to the data json
    if($scope.job.analysisConfig.categorizationFilters) {
      var doUpdate = false;

      // array lengths are different
      if($scope.job.analysisConfig.categorizationFilters.length !== params.job.analysisConfig.categorizationFilters.length) {
         doUpdate = true;
      }

      _.each($scope.job.analysisConfig.categorizationFilters, function(d, i) {
        if(d !== params.job.analysisConfig.categorizationFilters[i]) {
          doUpdate = true;
        }
      });

      if(doUpdate) {
        data.categorizationFilters = $scope.job.analysisConfig.categorizationFilters;
      }
    }

    // check custom settings
    if($scope.job.customSettings) {
      if($scope.job.customSettings.customUrls &&
         $scope.job.customSettings.customUrls.length) {

        var doUpdate = false;

        if(!params.job.customSettings ||
           !params.job.customSettings.customUrls ||
           !params.job.customSettings.customUrls.length) {
          // custom urls did not originally exist
          doUpdate = true;
        }
        else if($scope.job.customSettings.customUrls.length !== params.job.customSettings.customUrls.length) {
          // if both existed but now have different lengths
          doUpdate = true;
        } else {
          // if lengths are the same, check the contents match.
          _.each($scope.job.customSettings.customUrls, function(url, i) {
            if(url.urlName !== params.job.customSettings.customUrls[i].urlName ||
               url.urlValue !== params.job.customSettings.customUrls[i].urlValue) {
              doUpdate = true;
            }
          });
        }


        if(doUpdate) {
          data.customSettings = $scope.job.customSettings;
        }
      } else {
        if(params.job.customSettings ||
           params.job.customSettings.customUrls ||
           params.job.customSettings.customUrls.length) {
          // if urls orginally existed, but now don't
          // clear the custom settings completely
          data.customSettings = null;
        }
      }
    }

    // check scheduler
    if($scope.job.schedulerConfig && $scope.ui.schedulerStopped) {
      var doUpdate = false;

      var schedulerConfig = $scope.job.schedulerConfig;
      var sch = $scope.ui.scheduler;

      // set query text
      if(sch.queryText === "") {
        sch.queryText = '{"match_all":{}}';
      }
      var query = sch.queryText;
      try {
        query = JSON.parse(query);
      } catch(e){
        console.log("save(): could not parse query JSON");
      }

      var orginalQueryText = angular.toJson(schedulerConfig.query, true);
      // only update if it has changed from the original
      if(orginalQueryText !== sch.queryText) {
        schedulerConfig.query = query;
        doUpdate = true;
      }

      // only update if it has changed from the original
      if(sch.scrollSizeText !== schedulerConfig.scrollSize) {
        schedulerConfig.scrollSize = ((sch.scrollSizeText === "" || sch.scrollSizeText === null || sch.scrollSizeText === undefined)?sch.scrollSizeDefault:sch.scrollSizeText);
        doUpdate = true;
      }


      if(sch.serverAuthenticated) {
        // if the authentication tickbox is checked
        // check to see if the username has changed
        // the password will be blank as it needs to be reentered by the user
        if(sch.usernameText !== schedulerConfig.username ||
           sch.passwordText !== "") {
          schedulerConfig.username = sch.usernameText;
          schedulerConfig.password = sch.passwordText;
          doUpdate = true;
        }
      } else {
        // if the original config had a username but the tickbox is now unchecked
        // the user wants to remove authentication
        if(schedulerConfig.username) {
          delete schedulerConfig.username;
          delete schedulerConfig.password;
          doUpdate = true;
        }
      }

      // if changes have happened, add the whole schedulerConfig to the payload
      if(doUpdate) {
        data.schedulerConfig = schedulerConfig;
      }
    }

    // if anything has changed, post the changes
    if(Object.keys(data).length) {
      prlJobService.updateJob(jobId, data)
        .then(function(resp) {
          $scope.saveLock = false ;
          if(resp.success) {
              console.log(resp);
            msgs.clear();
            prlJobService.refreshJob(jobId)
              .then(function(job) {
                // no need to do anything. the job service broadcasts a jobs list update event
              })
              .catch(function(job){});
            $modalInstance.close();

          } else {
            msgs.error(resp.message);
          }
        });
      } else {
        // otherwise, close the window
        $modalInstance.close();
      }
  };

  $scope.cancel = function() {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
