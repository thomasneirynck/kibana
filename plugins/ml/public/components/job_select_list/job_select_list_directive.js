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

/*
 * ml-job-select-list directive for rendering a multi-select control for selecting
 * one or more jobs from the list of configured jobs.
 */

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import d3 from 'd3';
import { isTimeSeriesViewJob } from 'plugins/ml/util/job_utils';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlJobSelectList', function (mlJobService, mlJobSelectService, timefilter) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template: require('plugins/ml/components/job_select_list/job_select_list.html'),
    controller: function ($scope) {
      $scope.jobs = [];
      $scope.groups = [];
      $scope.singleSelection = false;
      $scope.timeSeriesOnly = false;
      $scope.selectableJobs = [];
      $scope.noJobsCreated = undefined;
      $scope.applyTimeRange = true;
      $scope.selections = [];
      $scope.allGroupsSelected = false;
      $scope.allJobsSelected = false;
      $scope.selectedJobRadio = '';
      $scope.selectedCount = 0;

      mlJobService.loadJobs()
        .then((resp) => {
          if (resp.jobs.length > 0) {
            $scope.noJobsCreated = false;
            const jobs = [];
            resp.jobs.forEach(job => {
              if (job.groups && job.groups.length) {
                job.groups.forEach(group => {
                  jobs.push(createJob(`${group}.${job.job_id}`, group, job));
                });
              } else {
                jobs.push(createJob(job.job_id, null, job));
              }
            });
            normalizeTimes(jobs);
            $scope.jobs = jobs;
            const { groups, homeless } = createGroups($scope.jobs);
            $scope.groups = groups;
            $scope.homelessJobs = homeless;
            $scope.allJobsSelected = areAllJobsSelected();
            $scope.allGroupsSelected = areAllGroupsSelected();
            createSelectedCount();

            $scope.selectableJobs = jobs.filter(job => !job.disabled);

            // if in single selection mode, set the radio button controller ($scope.selectedJobRadio)
            // to the selected job id
            if ($scope.singleSelection === true) {
              $scope.jobs.forEach(j => {
                if (j.selected) {
                  $scope.selectedJobRadio = j.id;
                }
              });
            }
          } else {
            $scope.noJobsCreated = true;
          }
        }).catch((resp) => {
          console.log('mlJobSelectList controller - error getting job info from ES:', resp);
        });

      function createJob(jobId, groupId, job) {
        return {
          id: jobId,
          name: job.job_id,
          group: groupId,
          selected: (($scope.selections.find(id => id === jobId) === undefined) ? false : true),
          disabled: !($scope.timeSeriesOnly === false || isTimeSeriesViewJob(job) === true),
          running: (job.datafeed_config && job.datafeed_config.state === 'started'),
          timeRange: {
            to: job.data_counts.latest_record_timestamp,
            from: job.data_counts.earliest_record_timestamp,
            fromPx: 0,
            toPx: 0,
            widthPx: 0,
            label: ''
          }
        };
      }

      function createGroups(jobsIn) {
        const jobGroups = {};
        const homeless = [];
        // first pull all of the groups out of all of the jobs
        // keeping homeless (groupless) jobs in a separate list
        jobsIn.forEach(job => {
          if (job.group !== null) {
            if (jobGroups[job.group] === undefined) {
              jobGroups[job.group] = [job];
            } else {
              jobGroups[job.group].push(job);
            }
          } else {
            homeless.push(job);
          }
        });

        const groups = _.map(jobGroups, (jobs, id) => {
          const group = {
            id,
            selected: false,
            selectable: true,
            expanded: false,
            jobs
          };
          // check to see whether all of the groups jobs have been selected,
          // if they have, select the group
          if ($scope.singleSelection === false) {
            group.selected = isGroupSelected({ jobs });
          }

          // if the whole group isn't selected, but one of it's jobs is, expand the group
          if (group.selected === false) {
            if (jobs.filter(job => job.selected === true).length) {
              group.expanded = true;
            }
          }

          // create an over all time range for the group
          const timeRange = {
            to: null,
            toMoment: null,
            from: null,
            fromMoment: null,
            fromPx: null,
            toPx: null,
            widthPx: null,
          };

          jobs.forEach(job => {
            job.group = group;
            job.disabled = group.selected;

            if (timeRange.to === null || job.timeRange.to > timeRange.to) {
              timeRange.to = job.timeRange.to;
              timeRange.toMoment = job.timeRange.toMoment;
            }
            if (timeRange.from === null || job.timeRange.from < timeRange.from) {
              timeRange.from = job.timeRange.from;
              timeRange.fromMoment = job.timeRange.fromMoment;
            }
            if (timeRange.toPx === null || job.timeRange.toPx > timeRange.toPx) {
              timeRange.toPx = job.timeRange.toPx;
            }
            if (timeRange.fromPx === null || job.timeRange.fromPx < timeRange.fromPx) {
              timeRange.fromPx = job.timeRange.fromPx;
            }
          });
          timeRange.widthPx = timeRange.toPx - timeRange.fromPx;
          timeRange.toMoment = moment(timeRange.to);
          timeRange.fromMoment = moment(timeRange.from);

          const fromString = timeRange.fromMoment.format('MMM Do YYYY, HH:mm');
          const toString =  timeRange.toMoment.format('MMM Do YYYY, HH:mm');
          timeRange.label = `${fromString} to ${toString}`;

          group.timeRange = timeRange;
          return group;
        });

        return {
          groups,
          homeless
        };
      }

      // create a list of job ids
      // if all jobs in a group have been selected,
      // replace with a single myGroup.* entry
      function createReducedJobIdList(jobs) {
        const groupsToReplace = [];
        const jobIds = [];

        const allJobsSelected = ($scope.jobs.length === $scope.jobs.filter(j => j.selected).length);
        // if all jobs have been selected, just return *
        if (allJobsSelected) {
          jobIds.push('*');
        } else {
          // otherwise reduce jobs to their groups if all have been selected
          $scope.groups.forEach(group => {
            const foundJobs = jobs.filter(job => (job.group !== null && job.group.id === group.id));
            if (foundJobs.length === group.jobs.length) {
              // all jobs in this group have been selected
              groupsToReplace.push(group);
            }
          });

          jobs.forEach(job => {
            if (job.group === null) {
              // if job is not in any groups, add it to the list
              jobIds.push(job.id);
            } else {
              // if this job's group hasn't been flagged for replacement, add it to the list
              if (groupsToReplace.find(g => g.id === job.group.id) === undefined) {
                jobIds.push(job.id);
              }
            }
          });

          groupsToReplace.forEach(group => {
            jobIds.push(`${group.id}.*`);
          });
        }
        return jobIds;
      }

      // apply the selected jobs
      $scope.apply = function () {
        // if in single selection mode, get the job id from $scope.selectedJobRadio
        const selectedJobs = $scope.singleSelection ?
          $scope.jobs.filter(job => job.id === $scope.selectedJobRadio) :
          $scope.jobs.filter(job => job.selected);


        let jobIds = [];
        if ($scope.singleSelection) {
          jobIds = selectedJobs.map(j => j.name);
        } else {
          jobIds = createReducedJobIdList(selectedJobs);
        }
        mlJobSelectService.setJobIds(jobIds);

        // if the apply time range checkbox is ticked,
        // find the min and max times for all selected jobs
        // and apply them to the timefilter
        if ($scope.applyTimeRange) {
          const times = [];
          selectedJobs.forEach(job => {
            if (job.timeRange.from !== undefined) {
              times.push(job.timeRange.from);
            }
            if (job.timeRange.to !== undefined) {
              times.push(job.timeRange.to);
            }
          });
          if (times.length) {
            const min = _.min(times);
            const max = _.max(times);
            timefilter.time.from = moment(min).toISOString();
            timefilter.time.to = moment(max).toISOString();
          }
        }
        $scope.closePopover();
      };

      // ticking a job
      $scope.toggleSelection = function (job) {
        const group = job.group;
        if (group !== null) {
          // if all jobs in that group are now selected
          // mark the group as selected and disable the jobs
          if (isGroupSelected(group)) {
            group.selected = true;
            group.jobs.forEach(j => j.disabled = true);
          } else {
            group.selected = false;
          }
        }
        // check to see if all jobs are now selected
        $scope.allJobsSelected = areAllJobsSelected();
        $scope.allGroupsSelected = areAllGroupsSelected();
        createSelectedCount();
      };

      // ticking the all jobs checkbox
      $scope.toggleAllJobsSelection = function () {
        const allJobsSelected = areAllJobsSelected();
        $scope.allJobsSelected = !allJobsSelected;

        $scope.homelessJobs.forEach(job => {
          job.selected = !allJobsSelected;
          if (job.group !== null) {
            job.disabled = !allJobsSelected;
          }
        });

        createSelectedCount();
      };

      // ticking a group
      $scope.toggleGroupSelection = function (group) {
        const groupAlreadySelected = isGroupSelected(group);
        group.selected = !groupAlreadySelected;

        group.jobs.forEach(job => {
          job.disabled = false;
          job.selected = group.selected;
          job.disabled = group.selected;
        });
        $scope.allGroupsSelected = areAllGroupsSelected();
        createSelectedCount();
      };

      // ticking the all jobs checkbox
      $scope.toggleAllGroupsSelection = function () {
        const allGroupsSelected = areAllGroupsSelected();
        $scope.allGroupsSelected = !allGroupsSelected;

        $scope.groups.forEach(group => {
          group.selected = !allGroupsSelected;
          group.jobs.forEach(job => {
            job.disabled = false;
            job.selected = group.selected;
            job.disabled = group.selected;
          });
        });
        createSelectedCount();
      };

      // check to see whether all jobs within a group have been selected
      function isGroupSelected(group) {
        let selected = true;
        group.jobs.forEach(job => {
          if (job.selected === false) {
            selected = false;
          }
        });
        return selected;
      }

      // check to see whether all jobs in the list have been selected
      function areAllJobsSelected() {
        let allSelected = true;
        $scope.homelessJobs.forEach(job => {
          if (job.selected === false) {
            allSelected = false;
          }
        });
        return allSelected;
      }

      // check to see whether all groups in the list have been selected
      function areAllGroupsSelected() {
        let allSelected = true;
        $scope.groups.forEach(group => {
          if (isGroupSelected(group) === false) {
            allSelected = false;
          }
        });
        return allSelected;
      }

      function createSelectedCount() {
        $scope.selectedCount = 0;
        $scope.jobs.forEach(job => {
          if (job.selected) {
            $scope.selectedCount++;
          }
        });
      }

      // create the data used for the gant charts
      function normalizeTimes(jobs) {
        const min = _.min(jobs, job => +job.timeRange.from);
        const max = _.max(jobs, job => +job.timeRange.to);

        const gantScale = d3.scale.linear().domain([min.timeRange.from, max.timeRange.to]).range([1, 299]);

        jobs.forEach(job => {
          if (job.timeRange.to !== undefined && job.timeRange.from !== undefined) {
            job.timeRange.fromPx = gantScale(job.timeRange.from);
            job.timeRange.toPx = gantScale(job.timeRange.to);
            job.timeRange.widthPx = job.timeRange.toPx - job.timeRange.fromPx;

            job.timeRange.toMoment = moment(job.timeRange.to);
            job.timeRange.fromMoment = moment(job.timeRange.from);

            const fromString = job.timeRange.fromMoment.format('MMM Do YYYY, HH:mm');
            const toString = job.timeRange.toMoment.format('MMM Do YYYY, HH:mm');
            job.timeRange.label = `${fromString} to ${toString}`;
          }
        });

      }

      $scope.useTimeRange = function (job) {
        timefilter.time.from = job.timeRange.fromMoment.toISOString();
        timefilter.time.to = job.timeRange.toMoment.toISOString();
      };
    },
    link: function (scope, element, attrs) {
      scope.timeSeriesOnly = false;
      if (attrs.timeseriesonly === 'true') {
        scope.timeSeriesOnly = true;
      }

      if (attrs.singleSelection === 'true') {
        scope.singleSelection = true;
      }

      // Make a copy of the list of jobs ids
      // '*' is passed to indicate 'All jobs'.
      scope.selections = [...mlJobSelectService.jobIdsWithGroup];

      // Giving the parent div focus fixes checkbox tick UI selection on IE.
      $('.ml-select-list', element).focus();
    }
  };
});
