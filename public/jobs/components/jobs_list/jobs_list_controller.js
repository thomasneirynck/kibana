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
import moment from 'moment-timezone';
import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';

// include the bootstrap patch for better popovers
import 'plugins/prelert/lib/angular_bootstrap_patch';

import jobsListControlsHtml from './jobs_list_controls.html';
import jobsListArrow from 'ui/doc_table/components/table_row/open.html';
import stringUtils from 'plugins/prelert/util/string_utils';
import 'ui/directives/confirm_click';
import 'plugins/prelert/components/log_usage';
import 'plugins/prelert/components/paginated_table';
import 'plugins/prelert/jobs/components/jobs_list/edit_job_modal';
import 'plugins/prelert/jobs/components/jobs_list/job_timepicker_modal';
import './expanded_row';

uiRoutes
.when('/jobs/?', {
  template: require('./jobs_list.html')
});

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert', ['ui.bootstrap']);

module.controller('PrlJobsList', function ($scope, $route, $location, $window, $timeout, $compile, $modal, es, timefilter, Private, prlMessageBarService, prlClipboardService, prlJobService, prlSchedulerService, prlBrowserDetectService) {

  timefilter.enabled = false; // remove time picker from top of page
  var rowScopes = []; // track row scopes, so they can be destroyed as needed
  var msgs = prlMessageBarService; // set a reference to the message bar service
  var TIME_FORMAT = "YYYY-MM-DD HH:mm:ss";
  var refreshCounter = 0;
  var auditMessages = {};
  $scope.noJobsCreated;
  $scope.toLocaleString = stringUtils.toLocaleString; // add toLocaleString to the scope to display nicer numbers
  $scope.filterText = "";
  $scope.filterIcon = 0;
  var isDistributed = false;
  var jobHosts = {};
  var filterRegexp;
  var jobFilterTimeout;

  // functions for job list buttons
  // called from jobs_list_controls.html
  $scope.deleteJob = function(job) {
    prlJobService.deleteJob(job)
      .then(function (resp) {
        if(resp.success) {
          msgs.clear();
          msgs.info("Job '"+ job.id + "' deleted");
          prlJobService.loadJobs();
        }
      });
  };

  $scope.editJob = function(job) {
    openEditJobWindow(job);
  };

  $scope.cloneJob = function(job) {
    prlJobService.currentJob = job;
    $location.path("jobs/new_job");
  };

  $scope.copyToClipboard = function(job) {
    var success = prlClipboardService.copy(angular.toJson(job));
    if(success) {
      msgs.clear();
      msgs.info(job.id+" JSON copied to clipboard");
    } else {
      msgs.error("Job could not be copied to the clipboard");
    }
  };

  $scope.startScheduler = function(job) {
    prlSchedulerService.openJobTimepickerWindow(job, $scope);
  };

  $scope.stopScheduler = function(job) {
    // setting the status to STOPPING disables the stop button
    job.schedulerStatus = 'STOPPING';
    prlJobService.stopScheduler(job.id);
  };


  $scope.viewResults = function(job, page) {
    if(job && page) {
      // get the time range first
      prlJobService.jobTimeRange(job.id)
        .then(function(resp) {
          // if no times are found, use last 24hrs to now
          var from = (resp.start.string)? "'"+resp.start.string+"'" : "now-24h";
          var to = (resp.end.string)? "'"+resp.end.string+"'" : "now";

          var path = chrome.getBasePath() + "/app/prelert#/"+page+"?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:"+from+",mode:absolute,to:"+to+"))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:'*')))&jobId="+job.id;

          // in safari, window.open does not work unless it has
          // been fired from an onclick event.
          // we can't used onclick for these buttons as they need
          // to contain angular expressions
          // therefore in safari we just redirect the page using location.href
          if(prlBrowserDetectService() === "safari") {
            location.href = path;
          } else {
            $window.open(path, '_blank');
          }
        }).catch(function(resp) {
          msgs.error("Job results for "+job.id+" could not be opened");
        });
    }
  };

  // function for displaying the time for a job based on latestRecordTimeStamp
  // added to rowScope so it can be updated live when data changes
  function latestTimeStamp(counts) {
    var obj = {string:"", unix: 0};
    if(counts.latestRecordTimeStamp) {
      obj.string = counts.latestRecordTimeStamp.replace(/\.\d{3}\+/, "+");
      obj.unix = moment(counts.latestRecordTimeStamp).unix();
    }
    return obj;
  }

  // function for displaying jobs list
  // this is never called directly. below it a listener is set for a jobsUpdated event
  // this is triggered (broadcasted) in prlJobService.loadJobs()
  // anytime the jobs list is reloaded, the display will be freshed.
  function displayJobs(jobs) {

    // keep track of whether the row has already been expanded
    // if this table is has been refreshed, it is helpful to reopen
    // any rows the user had open.
    var rowStates = {};
    _.each(rowScopes, function(rs) {
      rowStates[rs.job.id] = {
        open: rs.open,
        $expandElement: rs.$expandElement
      };
    });

    _.invoke(rowScopes, '$destroy');
    rowScopes.length = 0;
    $scope.jobs = jobs;
    $scope.jobsCount = jobs.length;

    $scope.table = {};
    $scope.table.perPage = 10;
    $scope.table.columns = [
      { title: '', sortable: false, class: "col-expand-arrow" },
      { title: 'Search name' },
      { title: '', sortable: false},
      { title: 'Description' },
      { title: 'Processed records', class: "col-align-right" },
      { title: 'Memory status'},
      { title: 'Job status' },
      { title: 'Scheduler status' },
      { title: 'Latest timestamp' },
      { title: 'Actions', sortable: false, class: "col-action" }
    ];

    if (isDistributed) {
      $scope.table.columns.splice(8, 0, { title: 'Host'});
    }

    $scope.kbnUrl = Private(require('ui/url'));

    var rows = jobs.map(function (job) {
      var rowScope = $scope.$new();
      rowScope.job = job;
      rowScope.jobAudit = {messages:"", update: function(){}, jobWarningClass: "", jobWarningText: ""};

      // rowScope.unsafeHtml = "<prl-job-preview prl-job-id='"+job.id+"'></prl-job-preview>";

      rowScope.expandable = true;
      rowScope.expandElement = "prl-job-list-expanded-row-container";
      rowScope.initRow = function() {
        // function called when row is opened for the first time
        if(rowScope.$expandElement &&
           rowScope.$expandElement.children().length === 0) {
          var $el = $(document.createElement("prl-job-list-expanded-row")).appendTo(this.$expandElement);
          $compile($el)(this);
        }
      };

      rowScope.time = latestTimeStamp;

      rowScopes.push(rowScope);
      var analysisConfig = job.analysisConfig;
      var jobDescription = job.description || "";

      // col array
      if($scope.filterText === undefined || $scope.filterText === "" || job.id.match(filterRegexp) || jobDescription.match(filterRegexp)) {
        var tableRow = [ {
              markup: jobsListArrow,
              scope:  rowScope
          }, {
              markup: filterHighlight(job.id),
              value:  job.id
          }, {
              markup: "<i ng-show='tab.jobWarningClass !== \"\"' tooltip='{{jobAudit.jobWarningText}}' class='{{jobAudit.jobWarningClass}}'></i>",
              scope:  rowScope
          }, {
              markup: filterHighlight(stringUtils.escape(jobDescription)),
              value:  jobDescription
          }, {
              markup: "<div class='col-align-right'>{{toLocaleString(job.counts.processedRecordCount)}}</div>",
              value:  job.counts.processedRecordCount ,
              scope:  rowScope
          }, {
              markup: "{{job.modelSizeStats.memoryStatus}}",
              value:  (function() { return (job.modelSizeStats)?job.modelSizeStats.memoryStatus: ""; }),
              scope:  rowScope
          }, {
              markup: "{{job.status}}",
              value:  job.status,
              scope:  rowScope
          }, {
              markup: "{{job.schedulerStatus}}",
              value:  job.schedulerStatus,
              scope:  rowScope
          }, {
              markup: "{{ time(job.counts).string }}",
              // use a function which returns the value as the time stamp value can change
              // but still needs be run though the time function to format it to unix time stamp
              value:  (function() { return rowScope.time(job.counts).unix; }),
              scope:  rowScope
          }, {
              markup: jobsListControlsHtml,
              scope:  rowScope
          }
        ];

        if (isDistributed) {
          var hostname = jobHosts[job.id];
          tableRow.splice(8, 0, {
                markup:  hostname,
                scope:  rowScope
            });
        }

        return tableRow;
      }
    });

    // filter out the rows that are undefined because they didn't match
    // the filter in the previous map
    rows = _.filter(rows, function(row) {
      if(row !== undefined) {
        return row;
      }
    });
    $scope.table.rows = rows;

    loadAuditSummary(jobs, rowScopes);

    // reapply the open flag for all rows.
    _.each(rowScopes, function(rs) {
      if(rowStates[rs.job.id]) {
        rs.open = rowStates[rs.job.id].open;
        rs.$expandElement = rowStates[rs.job.id].$expandElement;
      }
    });

    refreshCounter = 0;
    clearTimeout(window.singleJobTimeout);
    refreshCounts();

    // clear the filter spinner if it's running
    $scope.filterIcon = 0;
  }

  // start a recursive timeout check to check the statuses
  function refreshCounts() {
    var timeout = 5000; // 5 seconds

    window.singleJobTimeout = window.setTimeout(function() {
      // every 5th time, reload the counts and statuses of all the jobs
      if(refreshCounter % 5 === 0) {

        if (isDistributed) {
          prlJobService.jobHosts().then(
            function (jobHostsMap) {
              console.log("updated jobs hosts", jobHostsMap);
              jobHosts = jobHostsMap;

              prlJobService.updateAllJobCounts();
            });

        } else {
          prlJobService.updateAllJobCounts();
        }

        // also reload all of the jobs messages
        loadAuditSummary($scope.jobs, rowScopes);
      } else {
        // check to see if any jobs are "running" if so, reload their counts
        prlJobService.checkStatus();
      }


      // clear timeout to stop duplication
      clearTimeout(window.singleJobTimeout);
      window.singleJobTimeout = null;

      // keep track of number if times the check has been performed
      refreshCounter++;

      // reset the timeout only if we're still on the jobs list page
      if($location.$$path === "/jobs") {
        refreshCounts();
      }
    }, timeout);
  }

  // load and create audit log for the current job
  // log also includes system messages
  function loadAuditMessages(jobs, rowScopes, jobId) {
    var createTimes = {};
    var fromRange = "1M";
    var aDayAgo = moment().subtract(1, 'days');

    _.each(jobs, function(job) {
      if(auditMessages[job.id] === undefined) {
        auditMessages[job.id] = [];
      }
      // keep track of the job create times
      // only messages newer than the job's create time should be displayed.
      createTimes[job.id] = moment(job.createTime).unix();
    });

    // function for adding messages to job
    // deduplicated based on time and message
    function addMessage(id, msg) {
      if(auditMessages[id] !== undefined &&
         msg.unixTime >= createTimes[id]) {
        if(!_.findWhere(auditMessages[id], {time: msg.time, message: msg.message})) {
            auditMessages[id].push(msg);
        }
      }
    }

    return prlJobService.getJobAuditMessages(fromRange, jobId)
      .then(function(resp) {
        _.each(resp, function(msg) {
          var time = moment(msg["@timestamp"]);
          msg.time = time.format(TIME_FORMAT);
          msg.unixTime = time.unix();
          msg.isRecent = (time > aDayAgo);

          if(msg.jobId === "") {
            // system message
            msg.level = "SYSTEM_INFO";
            addMessage(jobId, msg);
          } else {
            // job specific message
            addMessage(msg.jobId, msg);
          }
        });

        // if we've loaded messages for just one job, they may be out of order
        // so sorting is needed.
        auditMessages[jobId] = _.sortBy(auditMessages[jobId], "unixTime");

        _.each(rowScopes, function(rs) {
          if(rs.job.id === jobId) {
            rs.jobAudit.messages = auditMessages[rs.job.id];
          }
        });

      })
      .catch(function(resp) {
        console.log("loadAuditMessages: audit messages for "+job.id+" could not be loaded");
        // $scope.jobAuditText = "Log could not be loaded";
        if(resp.message) {
          msgs.error(resp.message);
        }
      });
  }

  // function for loading audit messages for all jobs for displaying icons
  function loadAuditSummary(jobs, rowScopes) {
    var levels = {SYSTEM_INFO: -1, INFO:0, WARNING:1, ERROR:2};
    var jobMessages = {};
    var createTimes = {};

    _.each(jobs, function(job) {
      // keep track of the job create times
      // only messages newer than the job's create time should be displayed.
      createTimes[job.id] = moment(job.createTime).unix();
    });

    prlJobService.getAuditMessagesSummary()
    .then(function(resp) {
      _.each(resp, function(job) {
        // ignore system messages (id==="")
        if(job.key !== "") {
          if(job.levels && job.levels.buckets && job.levels.buckets.length) {
            var highestLevel = 0;
            var highestLevelText = "";
            var msgTime = 0;

            _.each(job.levels.buckets, function(level) {
              var label = level.key.toUpperCase();
                // note the highest message level
              if(levels[label] > highestLevel) {
                highestLevel = levels[label];
                if(level.latestMessage && level.latestMessage.buckets && level.latestMessage.buckets.length) {
                  _.each(level.latestMessage.buckets, function(msg) {
                    // there should only be one result here.
                    highestLevelText = msg.key;

                    // note the unix time for the highest level
                    // so we can filter them out later if they're earlier than the
                    // job's create time.
                    if(msg.latestMessage && msg.latestMessage.value_as_string) {
                      var time = moment(msg.latestMessage.value_as_string);
                      msgTime = time.unix();
                    }

                  });
                }
              }
            });

            jobMessages[job.key] = {
              id:               job.key,
              highestLevelText: highestLevelText,
              highestLevel:     highestLevel,
              msgTime:          msgTime
            };
          }
        }
      });

      // loop over the rowScopes and add icons if applicable
      _.each(rowScopes, function(rs) {
        // create the update function,
        // this is called when the messages tab is clicked for this row
        rs.jobAudit.update = function() {
          // return the promise chain from prlJobService.getJobAuditMessages
          // so we can scroll to the bottom of the list once it has loaded
          return loadAuditMessages(jobs, [rs], rs.job.id);
        };

        var job = jobMessages[rs.job.id];
        if(job && job.msgTime > createTimes[job.id] ) {
          rs.jobAudit.jobWarningClass = "";
          rs.jobAudit.jobWarningText = job.highestLevelText;
          if(job.highestLevel === 1) {
            rs.jobAudit.jobWarningClass = "job-warning fa fa-exclamation-circle";
          } else if(job.highestLevel === 2) {
            rs.jobAudit.jobWarningClass = "job-error fa fa-exclamation-triangle";
          }
        }
      });

    }).catch(function(resp) {
      console.log("loadAuditSummary: audit messages for all jobs could not be loaded");

      if(resp.message) {
          msgs.error(resp.message);
        }
    });
  }

  // create modal dialog for editing job descriptions
  function openEditJobWindow(job) {
    var modalInstance = $modal.open({
      template: require('plugins/prelert/jobs/components/jobs_list/edit_job_modal/edit_job_modal.html'),
      controller: 'PrlEditJobModal',
      backdrop: "static",
      keyboard: false,
      size: "lg",
      resolve: {
        params: function() {
          return {
            pscope: $scope,
            job: job,
          };
        }
      }
    });
  }

  // apply the text entered in the filter field and reload the jobs list
  $scope.applyFilter = function() {

    // clear the previous filter timeout
    clearTimeout(jobFilterTimeout);

    // create a timeout to redraw the jobs list based on the filter
    // a timeout is used as the user may still be in the process of
    // typing the filter when this function is first called.
    // after a second, if no more keystrokes have happened, redraw the jobs list
    jobFilterTimeout = $timeout(function() {
      displayJobs($scope.jobs);
      clearTimeout(jobFilterTimeout);
      jobFilterTimeout = undefined;
    }, 1000);

    // display the spinner icon after 250ms of typing.
    // the spinner is a nice way of showing that something is
    // happening as we're stalling for the user to stop tying.
    var $progress = $(".job-filter-progress-icon");
    $timeout(function() {
      $scope.filterIcon = 1;
    }, 250);

    // create the regexp used for highlighting the filter string for each job
    if($scope.filterText) {
      filterRegexp = new RegExp("("+$scope.filterText+")", "gi");
    } else {
      filterRegexp = undefined;
    }
  };

  // clear the filter text and regexp and apply the empty filter
  $scope.clearFilter = function() {
    $scope.filterText = "";
    $scope.filterRegexp = undefined;
    $scope.applyFilter();
  };

  // highlight which part of the job ID matches the filter text
  function filterHighlight(txt) {
    if($scope.filterText && filterRegexp) {
      txt = txt.replace(filterRegexp, "<span class='prl-mark'>$1</span>");
    }
    return txt;
  }

  // set up event listener
  $scope.$on('jobsUpdated', function(event, jobs, refreshedJob){
    // jobs = [];
    $scope.noJobsCreated = (jobs.length === 0);
    // jobs have been updated, redraw the list
    displayJobs(jobs);
  });


  prlJobService.isDistributed().then(
    function (value) {
      isDistributed = value;

      if (value) {
        prlJobService.jobHosts()
          .then(
            function (jobHostsMap) {
              console.log("Got jobs hosts", jobHostsMap);
              jobHosts = jobHostsMap;

              // trigger the first load
              prlJobService.loadJobs();
            }, function (reason) {
              console.log("jobHosts failed", reason);
              jobHosts = {};

              // trigger the first load
              prlJobService.loadJobs();
          });
      } else {
        prlJobService.loadJobs();
      }
    }, function (reason) {
      // trigger the first load
      prlJobService.loadJobs();
    });

  $scope.$emit('application.load');
});
