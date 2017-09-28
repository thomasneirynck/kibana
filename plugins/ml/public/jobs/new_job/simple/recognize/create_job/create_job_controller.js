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

import _ from 'lodash';
import moment from 'moment';
import angular from 'angular';
import 'ui/courier';
import dateMath from '@elastic/datemath';
import { isJobIdValid } from 'plugins/ml/util/job_utils';

import 'plugins/kibana/visualize/styles/main.less';

import uiRoutes from 'ui/routes';
import { checkLicense } from 'plugins/ml/license/check_license';
import { checkCreateJobsPrivilege } from 'plugins/ml/privilege/check_privilege';
import template from './create_job.html';

uiRoutes
.when('/jobs/new_job/simple/recognize/create', {
  template,
  resolve: {
    CheckLicense: checkLicense,
    privileges: checkCreateJobsPrivilege,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index),
    savedSearch: (courier, $route, savedSearches) => savedSearches.get($route.current.params.savedSearchId)
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlCreateRecognizerJobs', function (
  $scope,
  $window,
  $route,
  $q,
  ml,
  timefilter,
  Private,
  mlCreateRecognizerJobsService,
  mlJobService,
  mlESMappingService,
  mlMessageBarService) {

  timefilter.enabled = false;
  $scope.tt = timefilter;
  const msgs = mlMessageBarService;

  const SAVE_STATE = {
    NOT_SAVED: 0,
    SAVING: 1,
    SAVED: 2,
    FAILED: 3
  };

  const DATAFEED_STATE = {
    NOT_STARTED: 0,
    STARTING: 1,
    STARTED: 2,
    FINISHED: 3,
    STOPPING: 4,
    FAILED: 5
  };

  const query = {
    query_string: {
      analyze_wildcard: true,
      query: '*'
    }
  };

  $scope.SAVE_STATE = SAVE_STATE;
  $scope.DATAFEED_STATE = DATAFEED_STATE;

  $scope.overallState = SAVE_STATE.NOT_SAVED;
  const indexPattern = $route.current.locals.indexPattern;

  const pageTitle = `index pattern ${indexPattern.title}`;

  $scope.ui = {
    formValid: true,
    indexPattern,
    pageTitle,
    showJobInput: true,
    numberOfJobs: 0,
    kibanaLabels: {
      dashboard: 'Dashboards',
      search: 'Searches',
      visualization: 'Visualizations',
    },
    validation: {
      checks: {
        jobLabel: { valid: true },
        groupIds: { valid: true }
      },
    },
  };

  $scope.formConfig = {
    indexPattern,
    jobLabel: '',
    jobGroups: [],
    jobs: [],
    kibanaObjects: {
      dashboard: [],
      search: [],
      visualization: []
    },
    start: 0,
    end: 0,
    query,
    filters: [],
    useFullIndexData: true,
  };

  $scope.resultsUrl = '';

  const configId = $route.current.params.id;

  $scope.resetJob = function () {
    $scope.overallState = SAVE_STATE.NOT_SAVED;
    $scope.formConfig.jobs = [];
    $scope.formConfig.filters = [];
    $scope.formConfig.kibanaObjects.dashboard = [];
    $scope.formConfig.kibanaObjects.search = [];
    $scope.formConfig.kibanaObjects.visualization = [];

    loadJobConfigs();
  };

  function loadJobConfigs() {
    // load the job and datafeed configs as well as the kibana saved objects
    // from the recognizer endpoint
    ml.getRecognizerConfigs({ configId })
    .then(resp => {
      // populate the jobs and datafeeds
      if (resp.jobs && resp.jobs.length) {

        const tempGroups = {};

        resp.jobs.forEach((job) => {
          $scope.formConfig.jobs.push({
            id: job.id,
            jobConfig: job.config,
            jobState: SAVE_STATE.NOT_SAVED,
            datafeedId: null,
            datafeedConfig: {},
            datafeedState: SAVE_STATE.NOT_SAVED,
            runningState :DATAFEED_STATE.NOT_STARTED,
            errors: []
          });
          $scope.ui.numberOfJobs++;

          // read the groups list from each job and create a deduplicated jobGroups list
          if (job.config.groups && job.config.groups.length) {
            job.config.groups.forEach((group) => {
              tempGroups[group] = null;
            });
          }
        });
        $scope.formConfig.jobGroups = Object.keys(tempGroups);

        resp.datafeeds.forEach((datafeed) => {
          const job = _.find($scope.formConfig.jobs, { id: datafeed.config.job_id });
          if (job !== undefined) {
            const datafeedId = mlJobService.getDatafeedId(job.id);
            job.datafeedId = datafeedId;
            job.datafeedConfig = datafeed.config;
          }
        });
      }
      // populate the kibana saved objects
      if (resp.kibana) {
        _.each(resp.kibana, (obj, key) => {
          obj.forEach((o) => {
            $scope.formConfig.kibanaObjects[key].push({
              id: o.id,
              title: o.title,
              saveState: SAVE_STATE.NOT_SAVED,
              config: o.config,
              exists: false
            });
          });
        });
        // check to see if any of the saved objects already exist.
        // if they do, they are marked as such and greyed out.
        checkIfKibanaObjectsExist($scope.formConfig.kibanaObjects);
      }
    });
  }

  // toggle kibana's timepicker
  $scope.changeUseFullIndexData = function () {
    timefilter.enabled = !$scope.formConfig.useFullIndexData;
    $scope.$applyAsync();
  };

  $scope.changeJobLabelCase = function () {
    $scope.formConfig.jobLabel = $scope.formConfig.jobLabel.toLowerCase();
  };

  // save everything
  $scope.save = function () {
    if (validateJobs()) {
      $scope.overallState = SAVE_STATE.SAVING;
      angular.element('.results').css('opacity', 1);
      // wait 500ms for the results section to fade in.
      window.setTimeout(() => {
        // save jobs
        createJobs()
        .then(() => {
          // save saved objects
          createSavedObjects()
          .then(() => {
            $scope.overallState = SAVE_STATE.SAVED;
            createResultsUrl();
          })
          .catch(() => {
            $scope.overallState = SAVE_STATE.FAILED;
          });
        })
        .catch(() => {
          $scope.overallState = SAVE_STATE.FAILED;
        });
      }, 500);
    }
  };

  function createJobs() {
    return $q((resolve, reject) => {

      let jobsCounter = $scope.formConfig.jobs.length;

      function checkFinished() {
        jobsCounter--;
        if (jobsCounter === 0) {
          startDatafeeds()
          .then(() => {
            resolve();
          }).catch(() => {
            reject();
          });
        }
      }

      msgs.clear();

      // change the custom urls in each job to use the indexpattern id rather than title
      updateJobUrls();

      $scope.formConfig.jobs.forEach((job) => {
        job.jobState = SAVE_STATE.SAVING;
        job.errors = [];
        mlCreateRecognizerJobsService.createJob(job, $scope.formConfig)
        .then(() =>{
          job.jobState = SAVE_STATE.SAVED;
          job.datafeedState = SAVE_STATE.SAVING;
          mlCreateRecognizerJobsService.createDatafeed(job, $scope.formConfig)
          .then(() =>{
            job.datafeedState = SAVE_STATE.SAVED;
            checkFinished();
          })
          .catch((resp) => {
            job.datafeedState = SAVE_STATE.FAILED;
            if (resp.resp && resp.resp.message) {
              job.errors.push(resp.resp.message);
            }
            console.log('Saving datafeed failed', resp);
            checkFinished();
          });
        })
        .catch((resp) => {
          job.jobState = SAVE_STATE.FAILED;
          job.datafeedState = SAVE_STATE.FAILED;
          if (resp.resp && resp.resp.message) {
            job.errors.push(resp.resp.message);
          }
          console.log('Saving job failed', resp);
          checkFinished();
        });
      });

    });
  }

  function startDatafeeds() {
    return $q((resolve, reject) => {

      const jobs = $scope.formConfig.jobs;
      const numberOfJobs = jobs.length;

      mlCreateRecognizerJobsService.indexTimeRange($scope.formConfig.indexPattern, $scope.formConfig)
      .then((resp) => {
        if ($scope.formConfig.useFullIndexData) {
          $scope.formConfig.start = resp.start.epoch;
          $scope.formConfig.end = resp.end.epoch;
        } else {
          $scope.formConfig.start = dateMath.parse(timefilter.time.from).valueOf();
          $scope.formConfig.end = dateMath.parse(timefilter.time.to).valueOf();
        }
        let jobsCounter = 0;
        let datafeedCounter = 0;

        open(jobs[jobsCounter]);

        function incrementAndOpen(job) {
          jobsCounter++;
          if (jobsCounter < numberOfJobs) {
            open(jobs[jobsCounter]);
          } else {
            // if the last job failed, reject out of the function
            // so it can be caught higher up
            if (job.runningState === DATAFEED_STATE.FAILED) {
              reject();
            }
          }
        }

        function open(job) {
          if (job.jobState === SAVE_STATE.FAILED) {
            job.runningState = DATAFEED_STATE.FAILED;
            incrementAndOpen(job);
            return;
          }
          job.runningState = DATAFEED_STATE.STARTING;
          const jobId = $scope.formConfig.jobLabel + job.id;
          mlJobService.openJob(jobId)
          .then(() => {
            incrementAndOpen(job);
            start(job);
          }).catch((err) => {
            console.log('Opening job failed', err);
            start(job);
            job.errors.push(err.message);
            incrementAndOpen(job);
          });
        }

        function start(job) {
          mlCreateRecognizerJobsService.startDatafeed(job, $scope.formConfig)
          .then(() => {
            job.runningState = DATAFEED_STATE.STARTED;
            datafeedCounter++;
            if (datafeedCounter === numberOfJobs) {
              resolve();
            }
          })
          .catch((err) => {
            console.log('Starting datafeed failed', err);
            job.errors.push(err.message);
            job.runningState = DATAFEED_STATE.FAILED;
            reject(err);
          });
        }
      });
    });
  }

  function createSavedObjects() {
    return saveAllKibanaObjects($scope.formConfig.kibanaObjects);
  }

  function saveAllKibanaObjects(kibanaObjects) {
    return $q((resolve) => {

      let numberOfObjects = 0;
      // keep count of the number of saved objects to save
      _.each(kibanaObjects, (objects) => {
        objects.forEach(obj => {
          if (!obj.exists) {
            numberOfObjects++;
            obj.saveState = SAVE_STATE.SAVING;
          }
        });
      });

      function checkFinished() {
        if (numberOfObjects > 0) {
          numberOfObjects--;
        }
        if (numberOfObjects === 0) {
          resolve();
        }
      }

      _.each(kibanaObjects, (objects, type) => {
        objects.forEach(obj => {
          // if the kibana object doesn't already exist
          if (!obj.exists) {

            // update index id inside each object
            const searchSource = JSON.parse(obj.config.kibanaSavedObjectMeta.searchSourceJSON);
            if (searchSource.index && searchSource.index === $scope.formConfig.indexPattern.title) {
              searchSource.index = $scope.formConfig.indexPattern.id;
              obj.config.kibanaSavedObjectMeta.searchSourceJSON = JSON.stringify(searchSource);
            }

            // save the object
            mlCreateRecognizerJobsService.createSavedObjectWithId(type, obj.id, obj.config)
            .then(() => {
              obj.saveState = SAVE_STATE.SAVED;
              checkFinished();
            })
            .catch((e) => {
              console.log('Saving saved object failed', e);
              checkFinished();
            });
          } else {
            checkFinished();
          }
        });
      });

      /*
      saveKibanaObjects(kibanaObjects, 'search')
      .then(() => {
        saveKibanaObjects(kibanaObjects, 'visualization')
        .then(() => {
          saveKibanaObjects(kibanaObjects, 'dashboard')
          .then(() => {

          })
          .catch(() => {

          });
        })
        .catch(() => {

        });
      })
      .catch(() => {

      });
      */
    });
  }

  // function saveKibanaObjects(kibanaObjects, type) {
  //   return $q((resolve, reject) => {
  //     let count = 0;
  //     save(kibanaObjects[type][0]);

  //     function save(savedObject) {
  //       if (!savedObject.exists) {
  //         mlCreateRecognizerJobsService.createSavedObject(type, savedObject.config)
  //         .then((resp) => {
  //           if (resp) {
  //             // console.log(resp);
  //             savedObject.saveState = SAVE_STATE.SAVED;
  //             updateKibanaObjectIds(kibanaObjects, type, savedObject, resp.id);
  //             count++;
  //             if (count < kibanaObjects[type].length) {
  //               save(kibanaObjects[type][count]);
  //             } else {
  //               resolve();
  //             }
  //           }
  //         })
  //         .catch((resp) => {
  //           console.log(resp);
  //           savedObject.saveState = SAVE_STATE.FAILED;
  //           reject();
  //         });
  //       }
  //     }
  //   });
  // }

  // function updateKibanaObjectIds(kibanaObjects, type, savedObject, newId) {
  //   const oldId = savedObject.id;
  //   savedObject.id = newId;
  //   if (type === 'search') {
  //     kibanaObjects.visualization.forEach(obj => {
  //       if (obj.config.savedSearchId && obj.config.savedSearchId === oldId) {
  //         obj.config.savedSearchId = newId;
  //       }
  //     });
  //   }
  //   if (type === 'visualization') {
  //     kibanaObjects.dashboard.forEach(obj => {
  //       const panels = JSON.parse(obj.config.panelsJSON);
  //       panels.forEach(panel => {
  //         if (panel.id === oldId) {
  //           panel.id = newId;
  //         }
  //       });
  //       obj.config.panelsJSON = JSON.stringify(panels);
  //     });
  //   }
  //   // if (type === 'dashboard') {
  //   // }

  // }

  function checkIfKibanaObjectsExist(kibanaObjects) {
    _.each(kibanaObjects, (objects, type) => {
      objects.forEach((obj) => {
        checkForSavedObject(type, obj)
        .then((result) => {
          if (result) {
            obj.saveState = SAVE_STATE.SAVED;
            obj.exists = true;
          }
        });
      });
    });
  }

  function checkForSavedObject(type, savedObject) {
    return $q((resolve, reject) => {
      let exists = false;
      mlCreateRecognizerJobsService.loadExistingSavedObjects(type)
      .then((resp) => {
        const savedObjects = resp.savedObjects;
        savedObjects.forEach((obj) => {
          if (savedObject.title === obj.attributes.title) {
            exists = true;
            savedObject.id = obj.id;
          }
        });
        resolve(exists);
      }).catch((resp) => {
        console.log('Could not load saved objects', resp);
        reject(resp);
      });
    });
  }

  // update custom urls inside jobs.
  // replacing index title for index id
  function updateJobUrls() {
    const title = $scope.formConfig.indexPattern.title;
    const id = $scope.formConfig.indexPattern.id;

    $scope.formConfig.jobs.forEach((job) => {
      if (job.jobConfig.custom_settings &&
        job.jobConfig.custom_settings.custom_urls &&
        job.jobConfig.custom_settings.custom_urls.length) {
        job.jobConfig.custom_settings.custom_urls.forEach(url => {
          url.url_value = url.url_value.replace(title, id);
        });
      }
    });
  }

  function createResultsUrl() {
    const jobIds = [];
    // create a flat list of job ids.
    // if groups have been configured, create duplicate jobs for each group
    if ($scope.formConfig.jobGroups.length) {
      $scope.formConfig.jobs.forEach(job => {
        $scope.formConfig.jobGroups.forEach(group => {
          jobIds.push(`'${group}.${$scope.formConfig.jobLabel}${job.id}'`);
        });
      });
    } else {
      $scope.formConfig.jobs.forEach((job) => {
        jobIds.push(`'${$scope.formConfig.jobLabel}${job.id}'`);
      });
    }
    const jobIdsString = jobIds.join(',');

    const from = moment($scope.formConfig.start).toISOString();
    const to = moment($scope.formConfig.end).toISOString();
    let path = '';
    path += 'ml#/explorer';
    path += `?_g=(ml:(jobIds:!(${jobIdsString}))`;
    path += `,refreshInterval:(display:Off,pause:!f,value:0),time:(from:'${from}'`;
    path += `,mode:absolute,to:'${to}'`;
    path += '))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'*\')))';

    $scope.resultsUrl = path;
  }

  function validateJobs() {
    let valid = true;
    const checks = $scope.ui.validation.checks;
    _.each(checks, (item) => {
      item.valid = true;
    });

    // add an extra bit to the job label to avoid hitting the rule which states
    // you can't have an id ending in a - or _
    // also to allow an empty label
    const label = `${$scope.formConfig.jobLabel}extra`;

    if (isJobIdValid(label) === false) {
      valid = false;
      checks.jobLabel.valid = false;
      let msg = 'Job label can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
      msg += 'must start and end with an alphanumeric character';
      checks.jobLabel.message = msg;
    }
    $scope.formConfig.jobGroups.forEach(group => {
      if (isJobIdValid(group) === false) {
        valid = false;
        checks.groupIds.valid = false;
        let msg = 'Job group names can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
        msg += 'must start and end with an alphanumeric character';
        checks.groupIds.message = msg;
      }
    });
    return valid;
  }

  loadJobConfigs();

});
