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

// Service with functions used for broadcasting job picker changes

import _ from 'lodash';
import { notify } from 'ui/notify';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlJobSelectService', function ($rootScope, mlJobService, globalState) {

  const self = this;

  function checkGlobalState() {
    if (globalState.ml === undefined) {
      globalState.ml = {};
      globalState.save();
    }
  }
  checkGlobalState();

  this.jobIdsWithGroup = [];
  this.jobIds = [];
  this.description = { txt: '' };
  this.singleJobDescription = { txt: '' };

  // Broadcasts that a change has been made to the selected jobs.
  this.broadcastJobSelectionChange = function () {
    $rootScope.$broadcast('jobSelectionChange', this.getSelectedJobIds());
  };

  // Add a listener for changes to the selected jobs.
  this.listenJobSelectionChange = function (scope, callback) {
    const handler = $rootScope.$on('jobSelectionChange', callback);
    scope.$on('$destroy', handler);
  };

  function loadJobIdsFromGlobalState() {
    const jobIds = [];
    if (globalState.ml && globalState.ml.jobIds) {
      let tempJobIds = [];
      if (typeof globalState.ml.jobIds === 'string') {
        tempJobIds.push(globalState.ml.jobIds);
      } else {
        tempJobIds = globalState.ml.jobIds;
      }
      const invalidIds = getInvalidJobIds(removeGroupIds(tempJobIds));
      warnAboutInvalidJobIds(invalidIds);

      let validIds = _.difference(tempJobIds, invalidIds);

      // if there are no valid ids, warn and then select the first job
      if (validIds.length === 0) {
        const warningText = `No jobs selected, auto selecting first job`;
        notify.warning(warningText, { lifetime: 30000 });

        if (mlJobService.jobs.length) {
          validIds = [mlJobService.jobs[0].job_id];
        }
      }
      jobIds.push(...validIds);

      // replace the job ids in the url with the ones which are valid
      storeJobIdsInGlobalState(jobIds);
    } else {
      checkGlobalState();

      // no jobs selected, use the first in the list
      if (mlJobService.jobs.length) {
        jobIds.push(mlJobService.jobs[0].job_id);
      }
      storeJobIdsInGlobalState(jobIds);
    }

    return jobIds;
  }

  function storeJobIdsInGlobalState(jobIds) {
    globalState.ml.jobIds = jobIds;
    globalState.save();
  }

  // check that the ids read from the url exist by comparing them to the
  // jobs loaded via mlJobsService.
  function getInvalidJobIds(ids) {
    return ids.filter(id => {
      const job = _.find(mlJobService.jobs, { 'job_id': id });
      return (job === undefined && id !== '*');
    });
  }

  function removeGroupIds(jobsIds) {
    return jobsIds.map(id => {
      const splitId = id.split('.');
      return (splitId.length > 1) ? splitId[1] : splitId[0];
    });
  }

  function warnAboutInvalidJobIds(invalidIds) {
    if (invalidIds.length > 0) {
      const warningText = (invalidIds.length === 1) ? `Requested job ${invalidIds} does not exist` :
          `Requested jobs ${invalidIds} do not exist`;
      notify.warning(warningText, { lifetime: 30000 });
    }
  }

  function createDescription(jobs) {
    let txt = '';
    // add up the number of jobs including duplicates if they belong to multiple groups
    const count = mlJobService.jobs.reduce((sum, job) => {
      return sum + ((job.groups === undefined) ? 1 : job.groups.length);
    }, 0);
    if (jobs.length === count) {
      txt = 'All jobs';
    } else {
      // not all jobs have been selected
      // add up how many jobs belong to groups and how many don't
      const groupCounts = {};
      let groupLessJobs = 0;
      jobs.forEach(job => {
        const obj = splitJobId(job);
        if (obj.group) {
          groupCounts[obj.group] = (groupCounts[obj.group] || 0) + 1;
        } else {
          groupLessJobs++;
        }
      });
      const wholeGroups = [];
      const groups = mlJobService.getJobGroups();
      // work out how many groups have all of their jobs selected
      groups.forEach(group => {
        const groupCount = groupCounts[group.id];
        if (groupCount !== undefined && groupCount === group.jobs.length) {
          // this group has all of it's jobs selected
          wholeGroups.push(group.id);
        } else {
          if (groupCount !== undefined) {
            // this job doesn't so add it to the count of groupless jobs
            groupLessJobs += groupCount;
          }
        }
      });

      // show the whole groups first
      if (wholeGroups.length) {
        txt = wholeGroups[0];
        if (wholeGroups.length > 1 || groupLessJobs > 0) {
          const total = (wholeGroups.length - 1) + groupLessJobs;
          txt += ` and ${total} other${(total > 1 ? 's' : '')}`;
        }
      } else {
        // otherwise just list the job ids
        txt = splitJobId(jobs[0]).job;
        if (jobs.length > 1) {
          txt += ` and ${jobs.length - 1} other${(jobs.length > 2 ? 's' : '')}`;
        }
      }
    }
    return txt;
  }
  // function to split the group from the job and return both or just the job
  function splitJobId(jobId) {
    let obj = {};
    const splitId = jobId.split('.');
    if (splitId.length === 2) {
      obj = { group: splitId[0], job: splitId[1] };
    } else {
      obj = { job: jobId };
    }
    return obj;
  }

  // expands `*` into groupId.jobId list
  // expands `groupId.*` into `groupId.jobId` list
  // expands `jobId` into `groupId.jobId` if job belongs to one or more groups
  // returns list of expanded job ids
  function expandGroups(jobsIds) {
    const newJobsIds = [];
    const groups = mlJobService.getJobGroups();
    jobsIds.forEach(jobId => {
      if (jobId === '*') {
        mlJobService.jobs.forEach(job => {
          if (job.groups === undefined) {
            newJobsIds.push(job.job_id);
          } else {
            newJobsIds.push(...job.groups.map(g => `${g}.${job.job_id}`));
          }
        });
      } else {
        const splitId = splitJobId(jobId);
        if (splitId.group !== undefined && splitId.job === '*') {
          const groupId = splitId.group;
          const group = groups.find(g => g.id === groupId);
          group.jobs.forEach(j => {
            newJobsIds.push(`${groupId}.${j.job_id}`);
          });
        }
        else {
          let groupFound = false;
          groups.forEach(g=> {
            if (g.jobs.find(j => j.job_id === jobId) !== undefined) {
              groupFound = true;
              newJobsIds.push(`${g.id}.${jobId}`);
            }
          });

          if (groupFound === false) {
            newJobsIds.push(jobId);
          }
        }
      }
    });
    return newJobsIds;
  }

  // takes an array of ids.
  // this could be a mixture of job ids, group ids or a *.
  // stores an expanded list of job ids (i.e. groupId.jobId) and a list of jobs ids only.
  // creates the description text used on the job picker button.
  function processIds(ids) {
    const expandedJobIds = expandGroups(ids);
    self.jobIdsWithGroup.length = 0;
    self.jobIdsWithGroup.push(...expandedJobIds);
    self.jobIds.length = 0;
    self.jobIds.push(...removeGroupIds(expandedJobIds));
    self.description.txt = createDescription(self.jobIdsWithGroup);
    self.singleJobDescription.txt = ids[0];
  }

  // called externally to retrieve the selected jobs ids.
  // passing in `true` will load the jobs ids from the URL first
  this.getSelectedJobIds = function (loadFromURL) {
    if (loadFromURL) {
      processIds(loadJobIdsFromGlobalState());
    }
    return this.jobIds;
  };

  // called externally to set the job ids.
  // job ids are added to the URL and an event is broadcast for anything listening.
  // e.g. the anomaly explorer or time series explorer.
  // currently only called by the jobs selection menu.
  this.setJobIds = function (jobIds) {
    processIds(jobIds);
    storeJobIdsInGlobalState(jobIds);
    this.broadcastJobSelectionChange();
  };

});
