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
import stringUtils from 'plugins/ml/util/string_utils';
import 'plugins/ml/jobs/components/new_job_advanced/detectors_list_directive';
import './styles/main.less';
import angular from 'angular';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.controller('PrlEditJobModal', function ($scope, $modalInstance, $modal, params, prlJobService, prlMessageBarService) {
  const msgs = prlMessageBarService;
  msgs.clear();
  $scope.saveLock = false;
  $scope.pscope = params.pscope;
  $scope.job = angular.copy(params.job);

  $scope.ui = {
    title: 'Edit ' + $scope.job.job_id,
    currentTab: 0,
    tabs: [
      { index: 0, title: 'Job Details', hidden: false },
      { index: 1, title: 'Scheduler', hidden: true },
      { index: 2, title: 'Detectors', hidden: false },
    ],
    changeTab: function (tab) {
      $scope.ui.currentTab = tab.index;
    },
    isScheduled: false,
    schedulerStopped: false,
    scheduler: {
      scrollSizeDefault: 1000,
    },
    stoppingScheduler: false,
    validation: {
      tabs:[
        {index: 0, valid: true, checks: { categorizationFilters: {valid: true} }}
      ]
    }
  };

  // extract scheduler settings
  if ($scope.job.scheduler_config) {
    const schedulerConfig = $scope.job.scheduler_config;
    $scope.ui.isScheduled = true;
    $scope.ui.tabs[1].hidden = false;
    $scope.ui.schedulerStopped = (!$scope.job.scheduler_status || $scope.job.scheduler_status === 'STOPPED');

    $scope.ui.scheduler.queryText = angular.toJson(schedulerConfig.query, true);
    $scope.ui.scheduler.scrollSizeText = schedulerConfig.scroll_size;
  }

  $scope.addCustomUrl = function () {
    if (!$scope.job.customSettings) {
      $scope.job.customSettings = {};
    }
    if (!$scope.job.customSettings.customUrls) {
      $scope.job.customSettings.customUrls = [];
    }

    $scope.job.customSettings.customUrls.push({ urlName: '', urlValue: '' });
  };

  $scope.removeCustomUrl = function (index) {
    $scope.job.customSettings.customUrls.splice(index, 1);
  };

  // add new categorization filter
  $scope.addCategorizationFilter = function () {
    if ($scope.job.analysis_config) {
      if (!$scope.job.analysis_config.categorization_filters) {
        $scope.job.analysis_config.categorization_filters = [];
      }

      $scope.job.analysis_config.categorization_filters.push('');
    }
  };

  // remove selected categorization filter
  $scope.removeCategorizationFilter = function (index) {
    if ($scope.job.analysis_config && $scope.job.analysis_config.categorization_filters) {
      $scope.job.analysis_config.categorization_filters.splice(index, 1);
    }
  };

  // convenient function to stop the scheduler from inside the edit dialog
  $scope.stopScheduler = function () {
    $scope.ui.stoppingScheduler = true;
    prlJobService.stopScheduler($scope.job.job_id)
      .then((resp) => {
        if (resp.acknowledged && resp.acknowledged === true) {
          $scope.ui.schedulerStopped = true;
        }
      });
  };

  function validateJob() {
    let valid = true;
    const tabs = $scope.ui.validation.tabs;
    // reset validations
    _.each(tabs,  (tab) => {
      tab.valid = true;
      // for (let check in tab.checks) {
      _.each(tab.checks, (check, c) => {
        tab.checks[c].valid = true;
        tab.checks[c].message = '';
      });
    });

    if ($scope.job.analysis_config.categorization_filters) {
      let v = true;
      _.each($scope.job.analysis_config.categorization_filters, (d) => {
        try {
          new RegExp(d);
        } catch (e) {
          v = false;
        }

        if (d === '' || v === false) {
          tabs[0].checks.categorization_filters.valid = false;
          valid = false;
        }
      });
    }
    return valid;
  }

  $scope.save = function () {
    msgs.clear();

    if (!validateJob()) {
      return;
    }

    $scope.saveLock = true;

    const jobId = $scope.job.job_id;
    const data = {};

    // if the job description has changed, add it to the data json
    if ($scope.job.description !== params.job.description) {
      data.description = $scope.job.description;
    }

    // check each detector. if the description or filters have changed, add it to the data json
    _.each($scope.job.analysis_config.detectors, (d, i) => {
      let changes = 0;

      const obj = {
        index: i,
      };

      if (d.detector_description !== params.job.analysis_config.detectors[i].detector_description) {
        obj.description = d.detector_description;
        changes++;
      }

      if (d.detector_rules !== params.job.analysis_config.detectors[i].detectorRules) {
        obj.detector_rules = d.detector_rules;
        changes++;
      }

      if (changes > 0) {
        if (data.detectors === undefined) {
          data.detectors = [];
        }
        data.detectors.push(obj);
      }
    });

    // check each categorization filter. if any have changed, add all to the data json
    if ($scope.job.analysis_config.categorization_filters) {
      let doUpdate = false;

      // array lengths are different
      if ($scope.job.analysis_config.categorization_filters.length !== params.job.analysis_config.categorization_filters.length) {
        doUpdate = true;
      }

      _.each($scope.job.analysis_config.categorization_filters, (d, i) => {
        if (d !== params.job.analysis_config.categorization_filters[i]) {
          doUpdate = true;
        }
      });

      if (doUpdate) {
        data.categorization_filters = $scope.job.analysis_config.categorization_filters;
      }
    }

    // check custom settings
    if ($scope.job.customSettings) {
      if ($scope.job.customSettings.customUrls &&
         $scope.job.customSettings.customUrls.length) {

        let doUpdate = false;

        if (!params.job.customSettings ||
           !params.job.customSettings.customUrls ||
           !params.job.customSettings.customUrls.length) {
          // custom urls did not originally exist
          doUpdate = true;
        }
        else if ($scope.job.customSettings.customUrls.length !== params.job.customSettings.customUrls.length) {
          // if both existed but now have different lengths
          doUpdate = true;
        } else {
          // if lengths are the same, check the contents match.
          _.each($scope.job.customSettings.customUrls, (url, i) => {
            if (url.urlName !== params.job.customSettings.customUrls[i].urlName ||
               url.urlValue !== params.job.customSettings.customUrls[i].urlValue) {
              doUpdate = true;
            }
          });
        }


        if (doUpdate) {
          data.customSettings = $scope.job.customSettings;
        }
      } else {
        if (params.job.customSettings ||
           params.job.customSettings.customUrls ||
           params.job.customSettings.customUrls.length) {
          // if urls orginally existed, but now don't
          // clear the custom settings completely
          data.customSettings = null;
        }
      }
    }

    // check scheduler
    if ($scope.job.scheduler_config && $scope.ui.schedulerStopped) {
      let doUpdate = false;

      const schedulerConfig = $scope.job.scheduler_config;
      const sch = $scope.ui.scheduler;

      // set query text
      if (sch.queryText === '') {
        sch.queryText = '{"match_all":{}}';
      }
      let query = sch.queryText;
      try {
        query = JSON.parse(query);
      } catch (e) {
        console.log('save(): could not parse query JSON');
      }

      const orginalQueryText = angular.toJson(schedulerConfig.query, true);
      // only update if it has changed from the original
      if (orginalQueryText !== sch.queryText) {
        schedulerConfig.query = query;
        doUpdate = true;
      }

      // only update if it has changed from the original
      if (sch.scrollSizeText !== schedulerConfig.scroll_size) {
        schedulerConfig.scroll_size = ((sch.scrollSizeText === '' || sch.scrollSizeText === null || sch.scrollSizeText === undefined)
          ? sch.scrollSizeDefault : sch.scrollSizeText);
        doUpdate = true;
      }

      // if changes have happened, add the whole schedulerConfig to the payload
      if (doUpdate) {
        data.schedulerConfig = schedulerConfig;
      }
    }

    // if anything has changed, post the changes
    if (Object.keys(data).length) {
      prlJobService.updateJob(jobId, data)
      .then((resp) => {
        $scope.saveLock = false;
        if (resp.success) {
          console.log(resp);
          msgs.clear();
          prlJobService.refreshJob(jobId)
            .then((job) => {
              // no need to do anything. the job service broadcasts a jobs list update event
            })
            .catch((job) => {});
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

  $scope.cancel = function () {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
