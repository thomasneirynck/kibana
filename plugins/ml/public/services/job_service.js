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
import angular from 'angular';
import anomalyUtils from 'plugins/ml/util/anomaly_utils';
import 'plugins/ml/services/info_service';
import 'plugins/ml/messagebar';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlJobService', function ($rootScope, $http, $q, es, ml, mlMessageBarService) {
  const msgs = mlMessageBarService;
  let jobs = [];
  let datafeedIds = {};
  this.currentJob = undefined;
  this.jobs = [];

  // Provide ready access to widely used basic job properties.
  // Note these get populated on a call to either loadJobs or getBasicJobInfo.
  this.basicJobs = {};
  this.jobDescriptions = {};
  this.detectorsByJob = {};
  this.customUrlsByJob = {};

  // private function used to check the job saving response
  function checkSaveResponse(resp, origJob) {
    if (resp) {
      if (resp.job_id) {
        if (resp.job_id === origJob.job_id) {
          console.log('checkSaveResponse(): save successful');
          return true;
        }
      } else {
        if (resp.errorCode) {
          console.log('checkSaveResponse(): save failed', resp);
          return false;
        }
      }
    } else {
      console.log('checkSaveResponse(): response is empty');
      return false;
    }
  }

  this.getBlankJob = function () {
    return {
      job_id: '',
      description: '',
      analysis_config: {
        bucket_span: 300,
        influencers:[],
        detectors :[]
      },
      data_description : {
        time_field:      '',
        time_format:     '', // 'epoch',
        field_delimiter: '',
        quote_character: '"',
        format:         'delimited'
      }
    };
  };

  this.loadJobs = function () {
    const deferred = $q.defer();
    jobs = [];
    datafeedIds = {};

    ml.jobs()
      .then((resp) => {
        console.log('loadJobs query response:', resp);

        // make deep copy of jobs
        angular.copy(resp.jobs, jobs);

        // load jobs stats
        ml.jobStats()
          .then((statsResp) => {
            // merge jobs stats into jobs
            for (let i = 0; i < jobs.length; i++) {
              const job = jobs[i];
              for (let j = 0; j < statsResp.jobs.length; j++) {
                if (job.job_id === statsResp.jobs[j].job_id) {
                  const jobStats = angular.copy(statsResp.jobs[j]);
                  // create empty placeholders for stats objects
                  job.data_counts = {};
                  job.model_size_stats = {};

                  job.state = jobStats.state;
                  job.data_counts = jobStats.data_counts;
                  job.model_size_stats = jobStats.model_size_stats;
                }
              }
            }
            this.loadDatafeeds()
            .then((datafeedsResp) => {
              for (let i = 0; i < jobs.length; i++) {
                for (let j = 0; j < datafeedsResp.datafeeds.length; j++) {
                  if (jobs[i].job_id === datafeedsResp.datafeeds[j].job_id) {
                    jobs[i].datafeed_config = datafeedsResp.datafeeds[j];

                    datafeedIds[jobs[i].job_id] = datafeedsResp.datafeeds[j].datafeed_id;
                  }
                }
              }
              processBasicJobInfo(this, jobs);
              this.jobs = jobs;
              deferred.resolve({jobs: this.jobs});
            });
          })
          .catch((err) => {
            error(err);
          });
      }).catch((err) => {
        error(err);
      });

    function error(err) {
      console.log('MlJobsList error getting list of jobs:', err);
      msgs.error('Jobs list could not be retrieved');
      msgs.error('', err);
      deferred.reject({jobs});
    }
    return deferred.promise;
  };

  this.refreshJob = function (jobId) {
    const deferred = $q.defer();
    ml.jobs({jobId})
      .then((resp) => {
        console.log('refreshJob query response:', resp);
        const newJob = {};
        if (resp.jobs && resp.jobs.length) {
          angular.copy(resp.jobs[0], newJob);

          // load jobs stats
          ml.jobStats({jobId})
            .then((statsResp) => {
              // merge jobs stats into jobs
              for (let j = 0; j < statsResp.jobs.length; j++) {
                if (newJob.job_id === statsResp.jobs[j].job_id) {
                  const statsJob = statsResp.jobs[j];
                  newJob.state = statsJob.state;
                  angular.copy(statsJob.data_counts, newJob.data_counts);
                  angular.copy(statsJob.model_size_stats, newJob.model_size_stats);
                }
              }

              // replace the job in the jobs array
              for (let i = 0; i < jobs.length; i++) {
                if (jobs[i].id === newJob.job_id) {
                  jobs[i] = newJob;
                }
              }

              const datafeedId = this.getDatafeedId(jobId);

              this.loadDatafeeds(datafeedId)
              .then((datafeedsResp) => {
                for (let i = 0; i < jobs.length; i++) {
                  for (let j = 0; j < datafeedsResp.datafeeds.length; j++) {
                    if (jobs[i].job_id === datafeedsResp.datafeeds[j].job_id) {
                      jobs[i].datafeed_config = datafeedsResp.datafeeds[j];

                      datafeedIds[jobs[i].job_id] = datafeedsResp.datafeeds[j].datafeed_id;
                    }
                  }
                }
                this.jobs = jobs;
                deferred.resolve({jobs: this.jobs});
              });
            })
            .catch((err) => {
              error(err);
            });
        }
      }).catch((err) => {
        error(err);
      });

    function error(err) {
      console.log('MlJobsList error getting list of jobs:', err);
      msgs.error('Jobs list could not be retrieved');
      msgs.error('', err);
      deferred.reject({jobs});
    }
    return deferred.promise;
  };

  this.loadDatafeeds = function (datafeedId) {
    const deferred = $q.defer();
    const datafeeds = [];
    const sId = (datafeedId !== undefined) ? {datafeed_id: datafeedId} : undefined;

    ml.datafeeds(sId)
      .then((resp) => {
        // console.log('loadDatafeeds query response:', resp);

        // make deep copy of datafeeds
        angular.copy(resp.datafeeds, datafeeds);

        // load datafeeds stats
        ml.datafeedStats()
          .then((statsResp) => {
            // merge datafeeds stats into datafeeds
            for (let i = 0; i < datafeeds.length; i++) {
              const datafeed = datafeeds[i];
              for (let j = 0; j < statsResp.datafeeds.length; j++) {
                if (datafeed.datafeed_id === statsResp.datafeeds[j].datafeed_id) {
                  datafeed.state = statsResp.datafeeds[j].state;
                }
              }
            }
            deferred.resolve({datafeeds});
          })
          .catch((err) => {
            error(err);
          });
      }).catch((err) => {
        error(err);
      });

    function error(err) {
      console.log('loadDatafeeds error getting list of datafeeds:', err);
      msgs.error('datafeeds list could not be retrieved');
      msgs.error('', err);
      deferred.reject(err);
    }
    return deferred.promise;
  };



  this.updateSingleJobCounts = function (jobId) {
    const deferred = $q.defer();
    console.log('mlJobService: update job counts and state for ' + jobId);
    ml.jobStats({jobId})
      .then((resp) => {
        console.log('updateSingleJobCounts controller query response:', resp);
        if (resp.jobs && resp.jobs.length) {
          const newJob = {};
          angular.copy(resp.jobs[0], newJob);

          // replace the job in the jobs array
          for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].job_id === jobId) {
              const job = jobs[i];
              job.data_counts = newJob.data_counts;
              if (newJob.model_size_stats) {
                job.model_size_stats = newJob.model_size_stats;
              }
              job.state = newJob.state;
            }
          }

          const datafeedId = this.getDatafeedId(jobId);

          this.loadDatafeeds(datafeedId)
          .then((datafeedsResp) => {
            for (let i = 0; i < jobs.length; i++) {
              for (let j = 0; j < datafeedsResp.datafeeds.length; j++) {
                if (jobs[i].job_id === datafeedsResp.datafeeds[j].job_id) {
                  jobs[i].datafeed_config = datafeedsResp.datafeeds[j];

                  datafeedIds[jobs[i].job_id] = datafeedsResp.datafeeds[j].datafeed_id;
                }
              }
            }
            deferred.resolve({jobs: this.jobs});
          })
          .catch((err) => {
            error(err);
          });
        } else {
          deferred.resolve({jobs: this.jobs});
        }

      }).catch((err) => {
        error(err);
      });

    function error(err) {
      console.log('updateSingleJobCounts error getting job details:', err);
      msgs.error('Job details could not be retrieved for ' + jobId);
      msgs.error('', err);
      deferred.reject({jobs});
    }

    return deferred.promise;
  };

  this.updateAllJobCounts = function () {
    const deferred = $q.defer();
    console.log('mlJobService: update all jobs counts and state');
    ml.jobStats().then((resp) => {
      console.log('updateAllJobCounts controller query response:', resp);
      let newJobsAdded = false;
      for (let d = 0; d < resp.jobs.length; d++) {
        const newJob = {};
        let jobExists = false;
        angular.copy(resp.jobs[d], newJob);

        // update parts of the job
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i];
          if (job.job_id === resp.jobs[d].job_id) {
            jobExists = true;
            job.data_counts = newJob.data_counts;
            if (newJob.model_size_stats) {
              job.model_size_stats = newJob.model_size_stats;
            }
            job.state = newJob.state;
          }
        }

        // a new job has been added, add it to the list
        if (!jobExists) {
          // add it to the same index position as it's found in jobs.
          jobs.splice(d, 0, newJob);
          newJobsAdded = true;
        }
      }

      this.loadDatafeeds()
        .then((datafeedsResp) => {
          for (let i = 0; i < jobs.length; i++) {
            for (let j = 0; j < datafeedsResp.datafeeds.length; j++) {
              if (jobs[i].job_id === datafeedsResp.datafeeds[j].job_id) {
                jobs[i].datafeed_config = datafeedsResp.datafeeds[j];

                datafeedIds[jobs[i].job_id] = datafeedsResp.datafeeds[j].datafeed_id;
              }
            }
          }
          this.jobs = jobs;

          // if after adding missing jobs, the retrieved number of jobs still differs from
          // the local copy, reload the whole list from scratch. some non-running jobs may have
          // been deleted by a different user.
          if (newJobsAdded || resp.jobs.length !== jobs.length) {
            console.log('updateAllJobCounts: number of jobs differs. reloading all jobs');
            this.loadJobs().then(() => {
              deferred.resolve({jobs: this.jobs, listChanged: true});
            })
            .catch((err) => {
              error(err);
            });
          } else {
            deferred.resolve({jobs: this.jobs, listChanged: false});
          }
        })
        .catch((err) => {
          error(err);
        });
    })
    .catch((err) => {
      error(err);
    });

    function error(err) {
      console.log('updateAllJobCounts error getting list job details:', err);
      msgs.error('Job details could not be retrieved');
      msgs.error('', err);
      deferred.reject({jobs});
    }

    return deferred.promise;
  };

  this.checkState = function () {
    const runningJobs = [];
    _.each(jobs, (job) => {
      if (job.datafeed_config && job.datafeed_config.state === 'started') {
        runningJobs.push(job);
      }
    });

    console.log('mlJobService: check state for ' + runningJobs.length + ' running jobs');
    _.each(runningJobs, (job) => {
      this.updateSingleJobCounts(job.job_id);
    });
  };

  this.updateSingleJobDatafeedState = function (jobId) {
    const deferred = $q.defer();

    const datafeedId = this.getDatafeedId(jobId);

    ml.datafeedStats({datafeedId})
    .then((resp) => {
      // console.log('updateSingleJobCounts controller query response:', resp);
      const datafeeds = resp.datafeeds;
      let state = 'UNKNOWN';
      if (datafeeds && datafeeds.length) {
        state = datafeeds[0].state;
      }
      deferred.resolve(state);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.saveNewJob = function (job) {
    // run then and catch through the same check
    const func = function (resp) {
      console.log('Response for job query:', resp);
      const success = checkSaveResponse(resp, job);
      return {success, job, resp};
    };

    // return the promise chain
    return ml.addJob({jobId: job.job_id, job})
      .then(func).catch(func);
  };

  this.deleteJob = function (job, statusIn) {
    const deferred = $q.defer();
    const status = statusIn || {stopDatafeed: 0, deleteDatafeed: 0, closeJob: 0, deleteJob: 0};
    console.log('deleting job: ' + job.job_id);

    // chain of endpoint calls to delete a job.

    // if job is datafeed, stop and delete datafeed first
    if (job.datafeed_config) {
      const datafeedId = this.getDatafeedId(job.job_id);
      // stop datafeed
      ml.stopDatafeed({datafeedId: datafeedId})
      .then(() => {
        status.stopDatafeed = 1;
      })
      .catch((resp) => {
        console.log('Delete job: stop datafeed', resp);
        status.stopDatafeed = checkError(resp);
      })
      .finally(() => {
        // delete datafeed
        ml.deleteDatafeed({datafeedId: datafeedId})
        .then(() => {
          status.deleteDatafeed = 1;
        })
        .catch((resp) => {
          console.log('Delete job: delete datafeed', resp);
          status.deleteDatafeed = checkError(resp);
        })
        .finally(() => {
          closeAndDeleteJob();
        });
      });
    } else {
      closeAndDeleteJob();
    }

    // close and delete the job
    function closeAndDeleteJob() {
      // close job
      ml.closeJob({jobId: job.job_id})
      .then(() => {
        status.closeJob = 1;
      })
      .catch((resp) => {
        console.log('Delete job: close job', resp);
        status.closeJob = checkError(resp);
      })
      .finally(() => {
        // delete job
        ml.deleteJob({jobId: job.job_id})
        .then(() => {
          status.deleteJob = 1;
          deferred.resolve({success: true});
        })
        .catch((resp) => {
          console.log('Delete job: delete job', resp);
          status.deleteJob = checkError(resp);

          msgs.error(resp.message);
          deferred.reject({success: false});
        });
      });
    }

    function checkError(resp) {
      // when stopping a datafeed or closing a job, they may already
      // be stopped or closed. This returns an error code of 409.
      // if this is the case, return a success.
      return (resp.statusCode === 409) ? 1 : -1;
    }

    return deferred.promise;
  };

  this.cloneJob = function (job) {
    // create a deep copy of a job object
    // also remove items from the job which are set by the server and not needed
    // in the future this formatting could be optional
    const tempJob = angular.copy(job);
    return this.removeJobEndpoints(tempJob);
  };

  this.updateJob = function (jobId, job) {
    // return the promise chain
    return ml.updateJob({jobId, job})
      .then((resp) => {
        console.log('update job', resp);
        return {success: true};
      }).catch((err) => {
        msgs.error('Could not update job: ' + jobId);
        console.log('update job', err);
        return {success: false, message: err.message};
      });
  };

  // remove end point paths from job JSON
  this.removeJobEndpoints = function (job) {
    delete job.location;
    delete job.dataEndpoint;
    delete job.endpoints;
    delete job.bucketsEndpoint;
    delete job.categoryDefinitionsEndpoint;
    delete job.recordsEndpoint;
    delete job.logsEndpoint;
    delete job.alertsLongPollEndpoint;

    return job;
  };

  // remove counts, times and state for cloning a job
  this.removeJobCounts = function (job) {
    delete job.state;
    delete job.data_counts;
    delete job.create_time;
    delete job.finished_time;
    delete job.last_data_time;
    delete job.model_size_stats;
    delete job.datafeed_state;
    delete job.average_bucket_processing_time_ms;
    delete job.results_index_name;

    return job;
  };

  // find a job based on the id
  this.getJob = function (jobId) {
    const job = _.find(jobs, (j) => {
      return j.job_id === jobId;
    });

    return job;
  };

  // use elastic search to load the start and end timestamps
  // add them to our own promise object and return that rather than the search results object
  this.jobTimeRange = function (jobId) {
    const deferred = $q.defer();
    const obj = {success: true, start: {epoch:0, string:''}, end: {epoch:0, string:''}};

    es.search({
      index: '.ml-anomalies-' + jobId,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:result AND result_type:bucket',
                  'analyze_wildcard': true
                }
              }
            ]
          }
        },
        'aggs': {
          'earliest': {
            'min': {
              'field': 'timestamp'
            }
          },
          'latest': {
            'max': {
              'field': 'timestamp'
            }
          }
        }
      }
    })
    .then((resp) => {
      if (resp.aggregations && resp.aggregations.earliest && resp.aggregations.latest) {
        obj.start.epoch = resp.aggregations.earliest.value;
        obj.start.string = resp.aggregations.earliest.value_as_string;

        obj.end.epoch = resp.aggregations.latest.value;
        obj.end.string = resp.aggregations.latest.value_as_string;
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // use elasticsearch to load basic information on jobs, as used by various result
  // dashboards in the Ml plugin. Returned response contains a jobs property,
  // which is an array of objects containing id, description, bucketSpan, detectors
  // and detectorDescriptions properties, plus a customUrls key if custom URLs
  // have been configured for the job.
  this.getBasicJobInfo = function () {
    const deferred = $q.defer();
    const obj = {success: true, jobs: []};

    ml.jobs()
      .then((resp) => {
        if (resp.jobs && resp.jobs.length > 0) {
          obj.jobs = processBasicJobInfo(this, resp.jobs);
        }
        deferred.resolve(obj);
      })
      .catch((resp) => {
        console.log('getBasicJobInfo error getting list of jobs:', resp);
        deferred.reject(resp);
      });

    return deferred.promise;
  };

  // Obtains the list of fields by which record level results may be viewed for all
  // the jobs that have been created. Essentially this is the list of unique 'by',
  // 'over' and 'partition' fields that have been defined across all the detectors for
  // a job, although for detectors with both 'by' and 'over' fields, the 'by' field name
  // is not returned since this field is not added to the top-level record fields.
  // Returned response contains a fieldsByJob property, with job ID keys
  // against an array of the field names by which record type results may be viewed
  // for that job.
  // Contains an addition '*' key which holds an array of the
  // unique fields across all jobs.
  this.getJobViewByFields = function () {
    const deferred = $q.defer();
    const obj = {success: true, fieldsByJob: {'*':[]}};

    ml.jobs()
      .then(function (resp) {
        if (resp.jobs && resp.jobs.length > 0) {
          _.each(resp.jobs, (jobObj) => {
            // Add the list of distinct by, over and partition fields for each job.
            const fieldsForJob = [];

            const analysisConfig = jobObj.analysis_config;
            const detectors = analysisConfig.detectors || [];
            _.each(detectors, (detector) => {
              if (_.has(detector, 'partition_field_name')) {
                fieldsForJob.push(detector.partition_field_name);
              }
              if (_.has(detector, 'over_field_name')) {
                fieldsForJob.push(detector.over_field_name);
              }
              // For jobs with by and over fields, don't add the 'by' field as this
              // field will only be added to the top-level fields for record type results
              // if it also an influencer over the bucket.
              if (_.has(detector, 'by_field_name') && !(_.has(detector, 'over_field_name'))) {
                fieldsForJob.push(detector.by_field_name);
              }
            });

            obj.fieldsByJob[jobObj.job_id] = _.uniq(fieldsForJob);
            obj.fieldsByJob['*'] = _.union(obj.fieldsByJob['*'], obj.fieldsByJob[jobObj.job_id]);
          });

          // Sort fields alphabetically.
          _.each(obj.fieldsByJob, (fields, jobId)=> {
            obj.fieldsByJob[jobId] = _.sortBy(fields, (field) => {
              return field.toLowerCase();
            });
          });
        }

        deferred.resolve(obj);

      })
      .catch((resp) => {
        console.log('getJobViewByFields error getting list of viewBy fields:', resp);
        deferred.reject(resp);
      });

    return deferred.promise;
  };

  // use elasticsearch to obtain the definition of the category with the
  // specified ID from the given index and job ID.
  // Returned response contains four properties - categoryId, regex, examples
  // and terms (space delimited String of the common tokens matched in values of the category).
  this.getCategoryDefinition = function (index, jobId, categoryId) {
    const deferred = $q.defer();
    const obj = {success: true, categoryId: categoryId, terms: null, regex: null, examples: []};


    es.search({
      index: index,
      size: 1,
      body: {
        'query': {
          'bool': {
            'filter': [
              {'term': {'_type': 'category_definition'}},
              {'term': {'job_id': jobId}},
              {'term': {'category_id': categoryId}}
            ]
          }
        }
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        const source = _.first(resp.hits.hits)._source;
        obj.categoryId = source.category_id;
        obj.regex = source.regex;
        obj.terms = source.terms;
        obj.examples = source.examples;
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // use elastic search to load the datafeed state data
  // endTimeMillis is used to prepopulate the datafeed start modal
  // when a job has previously been set up with an end time
  this.jobDatafeedState = function (jobId) {
    const deferred = $q.defer();
    const obj = {startTimeMillis:null, endTimeMillis:null };

    es.search({
      index: '.ml-anomalies-' + jobId,
      size: 1,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'type': {
                  'value': 'datafeedState'
                }
              }
            ]
          }
        },
        '_source': ['endTimeMillis', 'startTimeMillis']
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        _.each(resp.hits.hits, (hit)=> {
          const _source = hit._source;

          if (_.has(_source, 'startTimeMillis')) {
            obj.startTimeMillis = _source.startTimeMillis[0];
          }

          if (_.has(_source, 'endTimeMillis')) {
            obj.endTimeMillis = _source.endTimeMillis[0];
          }
        });
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // search for audit messages, jobId is optional.
  // without it, all jobs will be listed.
  // fromRange should be a string formatted in ES time units. e.g. 12h, 1d, 7d
  this.getJobAuditMessages = function (fromRange, jobId) {
    const deferred = $q.defer();
    const messages = [];

    let jobFilter = {};
    // if no jobId specified, load all of the messages
    if (jobId !== undefined) {
      jobFilter = {
        'bool': {
          'should': [
            {
              'term': {
                'job_id': '' // catch system messages
              }
            },
            {
              'term': {
                'job_id': jobId // messages for specified jobId
              }
            }
          ]
        }
      };
    }

    let timeFilter = {};
    if (fromRange !== undefined && fromRange !== '') {
      timeFilter = {
        'range': {
          'timestamp': {
            'gte': 'now-' + fromRange,
            'lte': 'now'
          }
        }
      };
    }

    es.search({
      index: '.ml-notifications',
      ignore_unavailable: true,
      size: 1000,
      body:
      {
        sort : [
          { 'timestamp' : {'order' : 'asc'}},
          { 'job_id' : {'order' : 'asc'}}
        ],
        'query': {
          'bool': {
            'filter': [
              {'term': {'_type': 'audit_message'}},
              {
                'bool': {
                  'must_not': {
                    'term': {
                      'level': 'activity'
                    }
                  }
                }
              },
              jobFilter,
              timeFilter
            ]
          }
        }
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        _.each(resp.hits.hits, (hit) => {
          messages.push(hit._source);
        });
      }
      deferred.resolve({messages});
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // search highest, most recent audit messages for all jobs for the last 24hrs.
  this.getAuditMessagesSummary = function () {
    const deferred = $q.defer();
    const aggs = [];

    es.search({
      index: '.ml-notifications',
      ignore_unavailable: true,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': {
              'range': {
                'timestamp': {
                  'gte': 'now-1d'
                }
              }
            }
          }
        },
        'aggs': {
          'levelsPerJob': {
            'terms': {
              'field': 'job_id',
            },
            'aggs': {
              'levels': {
                'terms': {
                  'field': 'level',
                },
                'aggs': {
                  'latestMessage': {
                    'terms': {
                      'field': 'message.raw',
                      'size': 1,
                      'order': {
                        'latestMessage': 'desc'
                      }
                    },
                    'aggs': {
                      'latestMessage': {
                        'max': {
                          'field': 'timestamp'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0 &&
        resp.aggregations &&
        resp.aggregations.levelsPerJob &&
        resp.aggregations.levelsPerJob.buckets &&
        resp.aggregations.levelsPerJob.buckets.length) {
        _.each(resp.aggregations.levelsPerJob.buckets, (agg) => {
          aggs.push(agg);
        });
      }
      deferred.resolve({messagesPerJob: aggs});
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // search to load a few records to extract the time field
  this.searchTimeFields = function (index, type, field) {
    const deferred = $q.defer();
    const obj = {time: ''};

    es.search({
      method: 'GET',
      index: index,
      type: type,
      size: 1,
      _source: field,
    })
    .then((resp) => {
      if (resp.hits.total !== 0 && resp.hits.hits.length) {
        const hit = resp.hits.hits[0];
        if (hit._source && hit._source[field]) {
          obj.time = hit._source[field];
        }
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.searchPreview = function (indexes, types, job) {
    const deferred = $q.defer();

    if (job.datafeed_config) {
      const data = {
        index:indexes,
        // removed for now because it looks like kibana are now escaping the & and it breaks
        // it was done this way in the first place because you can't sent <index>/<type>/_search through
        // kibana's proxy. it doesn't like type
        // '&type': types.join(',')
      };
      const body = {};

      let query = { 'match_all': {} };
      // if query is set, add it to the search, otherwise use match_all
      if (job.datafeed_config.query) {
        query = job.datafeed_config.query;
      }
      body.query = query;

      // if aggs or aggregations is set, add it to the search
      const aggregations = job.datafeed_config.aggs || job.datafeed_config.aggregations;
      if (aggregations && Object.keys(aggregations).length) {
        body.size = 0;
        body.aggregations = aggregations;

        // add script_fields if present
        const scriptFields = job.datafeed_config.script_fields;
        if (scriptFields && Object.keys(scriptFields).length) {
          body.script_fields = scriptFields;
        }

      } else {
        // if aggregations is not set and retrieveWholeSource is not set, add all of the fields from the job
        body.size = 10;

        // add script_fields if present
        const scriptFields = job.datafeed_config.script_fields;
        if (scriptFields && Object.keys(scriptFields).length) {
          body.script_fields = scriptFields;
        }


        const fields = {};

        // get fields from detectors
        if (job.analysis_config.detectors) {
          _.each(job.analysis_config.detectors, (dtr) => {
            if (dtr.by_field_name) {
              fields[dtr.by_field_name] = {};
            }
            if (dtr.field_name) {
              fields[dtr.field_name] = {};
            }
            if (dtr.over_field_name) {
              fields[dtr.over_field_name] = {};
            }
            if (dtr.partition_field_name) {
              fields[dtr.partition_field_name] = {};
            }
          });
        }

        // get fields from influencers
        if (job.analysis_config.influencers) {
          _.each(job.analysis_config.influencers, (inf) => {
            fields[inf] = {};
          });
        }

        // get fields from categorizationFieldName
        if (job.analysis_config.categorization_field_name) {
          fields[job.analysis_config.categorization_field_name] = {};
        }

        // get fields from summary_count_field_name
        if (job.analysis_config.summary_count_field_name) {
          fields[job.analysis_config.summary_count_field_name] = {};
        }

        // get fields from time_field
        if (job.data_description.time_field) {
          fields[job.data_description.time_field] = {};
        }

        // console.log('fields: ', fields);
        const fieldsList = Object.keys(fields);
        if (fieldsList.length) {
          body._source = fieldsList;
        }
      }

      data.body = body;

      es.search(data)
      .then((resp) => {
        deferred.resolve(resp);
      })
      .catch((resp) => {
        deferred.reject(resp);
      });
    }

    return deferred.promise;
  };

  this.openJob = function (jobId) {
    return ml.openJob({jobId});
  };

  this.closeJob = function (jobId) {
    return ml.closeJob({jobId});
  };


  this.saveNewDatafeed = function (datafeedConfig, jobId) {
    const datafeedId = 'datafeed-' + jobId;
    datafeedConfig.job_id = jobId;

    return ml.addDatafeed({
      datafeedId,
      datafeedConfig
    });
  };

  this.deleteDatafeed = function () {

  };

  // start the datafeed for a given job
  // refresh the job state on start success
  this.startDatafeed = function (datafeedId, jobId, start, end) {
    const deferred = $q.defer();
    ml.startDatafeed({
      datafeedId,
      start,
      end
    })
      .then((resp) => {
        // console.log(resp);
        // refresh the state for the job as it's now changed
        // this.updateSingleJobCounts(jobId);
        this.refreshJob(jobId);
        deferred.resolve(resp);

      }).catch((err) => {
        console.log('MlJobsList error starting datafeed:', err);
        msgs.error('Could not start datafeed for ' + jobId, err);
        deferred.reject(err);
      });
    return deferred.promise;
  };

  // stop the datafeed for a given job
  // refresh the job state on stop success
  this.stopDatafeed = function (datafeedId, jobId) {
    const deferred = $q.defer();
    ml.stopDatafeed({
      datafeedId
    })
      .then((resp) => {
        // console.log(resp);
        // refresh the state for the job as it's now changed
        // this.updateSingleJobCounts(jobId);
        this.refreshJob(jobId);
        deferred.resolve(resp);

      }).catch((err) => {
        console.log('MlJobsList error stoping datafeed:', err);
        msgs.error('Could not stop datafeed for ' + jobId, err);
        deferred.reject(err);
      });
    return deferred.promise;
  };

  // call the _mappings endpoint for a given ES server
  // returns an object of indices and their types
  this.getESMappings = function () {
    const deferred = $q.defer();
    let mappings = {};

    es.indices.getMapping()
      .then((resp) => {
        _.each(resp, (index) => {
          // switch the 'mappings' for 'types' for consistency.
          if (index.mappings !== index.types) {
            Object.defineProperty(index, 'types',
                Object.getOwnPropertyDescriptor(index, 'mappings'));
            delete index.mappings;
          }
        });
        mappings = resp;

        // remove the * mapping type
        _.each(mappings, (m) => {
          _.each(m.types, (t, i) => {
            if(i === '*') {
              delete m.types[i];
            }
          });
        });

        deferred.resolve(mappings);
      })
      .catch((resp) => {
        deferred.reject(resp);
      });

    return deferred.promise;
  };

  this.validateDetector = function (detector) {
    const deferred = $q.defer();
    if (detector) {
      ml.validateDetector({detector})
        .then((resp) => {
          deferred.resolve(resp);
        })
        .catch((resp) => {
          deferred.reject(resp);
        });
    } else {
      deferred.reject({});
    }
    return deferred.promise;
  };

  this.getDatafeedId = function (jobId) {
    let datafeedId = datafeedIds[jobId];
    if (datafeedId === undefined) {
      datafeedId = 'datafeed-' + jobId;
    }
    return datafeedId;
  };

  function processBasicJobInfo(mlJobService, jobsList) {
    // Process the list of job data obtained from the jobs endpoint to return
    // an array of objects containing the basic information (id, description, bucketSpan, detectors
    // and detectorDescriptions properties, plus a customUrls key if custom URLs
    // have been configured for the job) used by various result dashboards in the ml plugin.
    // The key information is stored in the mlJobService object for quick access.
    const processedJobsList = [];
    let detectorDescriptionsByJob = {};
    const detectorsByJob = {};
    const customUrlsByJob = {};

    _.each(jobsList, (jobObj) => {
      const analysisConfig = jobObj.analysis_config;
      const job = {
        id:jobObj.job_id,
        bucketSpan: +analysisConfig.bucket_span
      };

      if (_.has(jobObj, 'description') && /^\s*$/.test(jobObj.description) === false) {
        job.description = jobObj.description;
      } else {
        // Just use the id as the description.
        job.description = jobObj.job_id;
      }

      job.detectorDescriptions = [];
      job.detectors = [];
      const detectors = _.get(analysisConfig, 'detectors', []);
      _.each(detectors, (detector)=> {
        if (_.has(detector, 'detector_description')) {
          job.detectorDescriptions.push(detector.detector_description);
          job.detectors.push(detector);
        }
      });


      if (_.has(jobObj, 'custom_settings.custom_urls')) {
        job.customUrls = [];
        _.each(jobObj.custom_settings.custom_urls, (url) => {
          if (_.has(url, 'url_name') && _.has(url, 'url_value')) {
            job.customUrls.push(url);
          }
        });
        // Only add an entry for a job if customUrls have been defined.
        if (job.customUrls.length > 0) {
          customUrlsByJob[job.id] = job.customUrls;
        }
      }

      mlJobService.jobDescriptions[job.id] = job.description;
      detectorDescriptionsByJob[job.id] = job.detectorDescriptions;
      detectorsByJob[job.id] = job.detectors;
      mlJobService.basicJobs[job.id] = job;
      processedJobsList.push(job);
    });

    detectorDescriptionsByJob = anomalyUtils.labelDuplicateDetectorDescriptions(detectorDescriptionsByJob);
    _.each(detectorsByJob, (dtrs, jobId) => {
      _.each(dtrs, (dtr, i) => {
        dtr.detector_description = detectorDescriptionsByJob[jobId][i];
      });
    });
    mlJobService.detectorsByJob = detectorsByJob;
    mlJobService.customUrlsByJob = customUrlsByJob;

    return processedJobsList;
  }

});
