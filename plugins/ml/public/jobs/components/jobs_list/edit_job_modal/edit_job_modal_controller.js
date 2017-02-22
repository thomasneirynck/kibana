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
import 'plugins/ml/jobs/components/new_job_advanced/detectors_list_directive';
import './styles/main.less';
import angular from 'angular';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlEditJobModal', function ($scope, $modalInstance, $modal, params, mlJobService, mlMessageBarService) {
  const msgs = mlMessageBarService;
  msgs.clear();
  $scope.saveLock = false;
  $scope.pscope = params.pscope;
  $scope.job = angular.copy(params.job);

  $scope.ui = {
    title: 'Edit ' + $scope.job.job_id,
    currentTab: 0,
    tabs: [
      { index: 0, title: 'Job Details', hidden: false },
      { index: 1, title: 'Datafeed', hidden: true },
      { index: 2, title: 'Detectors', hidden: false },
    ],
    changeTab: function (tab) {
      $scope.ui.currentTab = tab.index;
    },
    isDatafeed: false,
    datafeedStopped: false,
    datafeed: {
      scrollSizeDefault: 1000,
    },
    stoppingDatafeed: false,
    validation: {
      tabs:[
        {index: 0, valid: true, checks: { categorizationFilters: {valid: true} }}
      ]
    }
  };

  // extract datafeed settings
  if ($scope.job.datafeed_config) {
    const datafeedConfig = $scope.job.datafeed_config;
    $scope.ui.isDatafeed = true;
    $scope.ui.tabs[1].hidden = false;
    $scope.ui.datafeedStopped = (!$scope.job.datafeed_state || $scope.job.datafeed_state === 'stopped');

    $scope.ui.datafeed.queryText = angular.toJson(datafeedConfig.query, true);
    $scope.ui.datafeed.scrollSizeText = datafeedConfig.scroll_size;
  }

  $scope.addCustomUrl = function () {
    if (!$scope.job.custom_settings) {
      $scope.job.custom_settings = {};
    }
    if (!$scope.job.custom_settings.custom_urls) {
      $scope.job.custom_settings.custom_urls = [];
    }

    $scope.job.custom_settings.custom_urls.push({ url_name: '', url_value: '' });
  };

  $scope.removeCustomUrl = function (index) {
    $scope.job.custom_settings.custom_urls.splice(index, 1);
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

  // convenient function to stop the datafeed from inside the edit dialog
  $scope.stopDatafeed = function () {
    $scope.ui.stoppingDatafeed = true;
    mlJobService.stopDatafeed($scope.job.job_id)
      .then((resp) => {
        if (resp.acknowledged && resp.acknowledged === true) {
          $scope.ui.datafeedStopped = true;
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
    if ($scope.job.custom_settings) {
      if ($scope.job.custom_settings.custom_urls &&
         $scope.job.custom_settings.custom_urls.length) {

        let doUpdate = false;

        if (!params.job.custom_settings ||
           !params.job.custom_settings.custom_urls ||
           !params.job.custom_settings.custom_urls.length) {
          // custom urls did not originally exist
          doUpdate = true;
        }
        else if ($scope.job.custom_settings.custom_urls.length !== params.job.custom_settings.custom_urls.length) {
          // if both existed but now have different lengths
          doUpdate = true;
        } else {
          // if lengths are the same, check the contents match.
          _.each($scope.job.custom_settings.custom_urls, (url, i) => {
            if (url.url_name !== params.job.custom_settings.custom_urls[i].url_name ||
               url.url_value !== params.job.custom_settings.custom_urls[i].url_value) {
              doUpdate = true;
            }
          });
        }


        if (doUpdate) {
          data.custom_settings = $scope.job.custom_settings;
        }
      } else {
        if (params.job.custom_settings ||
           params.job.custom_settings.custom_urls ||
           params.job.custom_settings.custom_urls.length) {
          // if urls orginally existed, but now don't
          // clear the custom settings completely
          data.custom_settings = null;
        }
      }
    }

    // check datafeed
    if ($scope.job.datafeed_config && $scope.ui.datafeedStopped) {
      let doUpdate = false;

      const datafeedConfig = $scope.job.datafeed_config;
      const sch = $scope.ui.datafeed;

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

      const orginalQueryText = angular.toJson(datafeedConfig.query, true);
      // only update if it has changed from the original
      if (orginalQueryText !== sch.queryText) {
        datafeedConfig.query = query;
        doUpdate = true;
      }

      // only update if it has changed from the original
      if (sch.scrollSizeText !== datafeedConfig.scroll_size) {
        datafeedConfig.scroll_size = ((sch.scrollSizeText === '' || sch.scrollSizeText === null || sch.scrollSizeText === undefined)
          ? sch.scrollSizeDefault : sch.scrollSizeText);
        doUpdate = true;
      }

      // if changes have happened, add the whole datafeedConfig to the payload
      if (doUpdate) {
        data.datafeedConfig = datafeedConfig;
      }
    }

    // if anything has changed, post the changes
    if (Object.keys(data).length) {
      mlJobService.updateJob(jobId, data)
      .then((resp) => {
        $scope.saveLock = false;
        if (resp.success) {
          console.log(resp);
          msgs.clear();
          mlJobService.refreshJob(jobId);
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
