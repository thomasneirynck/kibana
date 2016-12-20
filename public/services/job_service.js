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
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import 'plugins/prelert/services/prelert_angular_client';
import 'plugins/prelert/services/info_service';
import 'plugins/prelert/services/ml';
import 'plugins/prelert/messagebar';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlJobService', function ($rootScope, $http, $q, es, ml, prelertAPIService, prlMessageBarService, prlInfoService) {
  const apiService = prelertAPIService;
  const msgs = prlMessageBarService;
  let jobs = [];
  this.currentJob = undefined;
  this.jobs = [];
  this.basicJobs = {};
  this.jobDescriptions = {};
  this.detectorDescriptions = {};
  this.detectorsByJob = {};
  this.customUrlsByJob = {};

  // private function used to check the job saving response
  function checkSaveResponse(resp, origJob) {
    if (resp) {
      if (resp.id) {
        if (resp.id === origJob.id) {
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
      id: '',
      description: '',
      analysisConfig: {
        bucketSpan: 300,
        influencers:[],
        detectors :[]
      },
      dataDescription : {
        timeField:      '',
        timeFormat:     '', // 'epoch',
        fieldDelimiter: '',
        quoteCharacter: '"',
        format:         'DELIMITED'
      }
    };
  };

  this.loadJobs = function () {
    const that = this;
    jobs = [];

    // use the apiService to load the list of jobs
    // listJobs returns the $http request promise chain which we pass straight through
    // adding our own .then function to create the jobs list and broadcast the fact we've done so
    return ml.jobConfigs()
      .then(function (resp) {
        console.log('PrlJobsList controller query response:', resp);

        // make deep copy of jobs
        angular.copy(resp.jobs, jobs);
        that.jobs = jobs;

        // broadcast that the jobs list has been updated
        $rootScope.$broadcast('jobsUpdated', jobs);
        // also return the jobs list in case this function has been called directly
        return jobs;

      }).catch(function (err) {
        console.log('PrlJobsList error getting list of jobs:', err);
        msgs.error('Jobs list could not be retrieved');
        if (err.message) {
          if (err.message.match('getaddrinfo')) {
            msgs.error('The Prelert Engine API server could not be found.');
          }
          msgs.error(err.message);
        }
        return jobs;
      });
  };

  this.refreshJob = function (jobId) {
    return apiService.getJobDetails({jobId: jobId})
      .then(function (resp) {
        console.log('refreshJob controller query response:', resp);
        let newJob = {};
        angular.copy(resp.document, newJob);

        // replace the job in the jobs array
        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i].id === jobId) {
            jobs[i] = newJob;
          }
        }
        // broadcast the update
        // also add the id of the updated job as a second argument
        $rootScope.$broadcast('jobsUpdated', jobs, {id: jobId});
        return newJob;

      }).catch(function (err) {
        console.log('refreshJob error getting job details for ' + jobId + ':', err);
        msgs.error('Job details for ' + jobId + ' could not be retrieved');
        if (err.message) {
          msgs.error(err.message);
        }
        return null;
      });
  };

  this.updateSingleJobCounts = function (jobId) {
    console.log('prlJobService: update job counts and status for ' + jobId);
    return apiService.getJobDetails({jobId: jobId})
      .then(function (resp) {
        console.log('updateSingleJobCounts controller query response:', resp);
        let newJob = {};
        angular.copy(resp.document, newJob);

        // replace the job in the jobs array
        for (let i = 0; i < jobs.length; i++) {
          if (jobs[i].id === jobId) {
            jobs[i].counts = newJob.counts;
            if (newJob.modelSizeStats) {
              jobs[i].modelSizeStats = newJob.modelSizeStats;
            }
            jobs[i].lastDataTime = newJob.lastDataTime;
            jobs[i].createTime = newJob.createTime;
            jobs[i].status = newJob.status;
            jobs[i].schedulerStatus = newJob.schedulerStatus;
          }
        }
        return newJob;

      }).catch(function (err) {
        console.log('updateSingleJobCounts error getting job details:', err);
        msgs.error('Job details could not be retrieved for ' + jobId);
        if (err.message) {
          msgs.error(err.message);
        }
        return null;
      });
  };

  this.updateAllJobCounts = function () {
    const that = this;
    console.log('prlJobService: update all jobs counts and status');
    return apiService.listJobs()
      .then(function (resp) {
        console.log('updateAllJobCounts controller query response:', resp);
        for (let d = 0; d < resp.documents.length; d++) {
          let newJob = {};
          let jobExists = false;
          angular.copy(resp.documents[d], newJob);

          // update parts of the job
          for (let i = 0; i < jobs.length; i++) {
            if (jobs[i].id === resp.documents[d].id) {
              jobExists = true;
              jobs[i].counts = newJob.counts;
              if (newJob.modelSizeStats) {
                jobs[i].modelSizeStats = newJob.modelSizeStats;
              }
              jobs[i].lastDataTime = newJob.lastDataTime;
              jobs[i].createTime = newJob.createTime;
              jobs[i].status = newJob.status;
              jobs[i].schedulerStatus = newJob.schedulerStatus;
            }
          }

          // a new job has been added, add it to the list and broadcast an update
          if (!jobExists) {
            // add it to the same index position as it's found in documents.
            jobs.splice(d, 0, newJob);
            $rootScope.$broadcast('jobsUpdated', jobs);
          }
        }

        // if after adding missing jobs, the retrieved number of jobs still differs from
        // the local copy, reload the whole list from scratch. some non-running jobs may have
        // been deleted by a different user.
        if (resp.documents.length !== jobs.length) {
          console.log('updateAllJobCounts: number of jobs differs. reloading all jobs');
          that.loadJobs();
        }

      }).catch(function (err) {
        console.log('updateAllJobCounts error getting job details:', err);
        msgs.error('Job details could not be retrieved');
        if (err.message) {
          msgs.error(err.message);
        }
      });
  };

  this.checkStatus = function () {
    const that = this;
    let jobsMissing = false;

    const runningJobs = _.where(jobs, {status : 'RUNNING'});
    let counter = runningJobs.length;
    console.log('prlJobService: check status for ' + runningJobs.length + ' running jobs');
    _.each(runningJobs, (job) => {
      that.updateSingleJobCounts(job.id)
      .then((resp) => {
        if (resp.exists === false) {
          jobsMissing = true;
        }
        counter--;
        // once all job have been checked, reload the job list if
        // any jobs are missing. they may have been deleted by a
        // different user.
        if (counter === 0 && jobsMissing) {
          that.loadJobs();
        }
      });
    });
  };

  this.updateSingleJobSchedulerStatus = function (jobId) {
    const deferred = $q.defer();
    apiService.getJobDetails({jobId: jobId})
    .then((resp) => {
      // console.log('updateSingleJobCounts controller query response:', resp);
      deferred.resolve(resp.document.schedulerStatus);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.saveNewJob = function (job, overwrite) {
    const params = {};
    if (overwrite) {
      params.overwrite = true;
    }

    // run then and catch through the same check
    const func = function (resp) {
      console.log('Response for job query:', resp);
      const success = checkSaveResponse(resp, job);
      return {success:success, job: job, resp: resp};
    };

    // return the promise chain
    return apiService.saveNewJob(job, params)
      .then(func).catch(func);
  };

  this.deleteJob = function (job) {
    console.log('deleting job: ' + job.id);

    // return the promise chain
    return apiService.deleteJob(job.id)
      .then((resp) => {
        console.log('delete job', resp);
        return {success: true};
      }).catch((err) => {
          // msgs.error('Could not delete job: '+ job.id);
        msgs.error(err.message);
        console.log('delete job', err);
        return {success: false};
      });
  };

  this.cloneJob = function (job) {
    // create a deep copy of a job object
    // also remove items from the job which are set by the server and not needed
    // in the future this formatting could be optional
    let tempJob = this.removeJobEndpoints(angular.copy(job, tempJob));
    return tempJob;
  };

  this.updateJob = function (jobId, data) {
    // return the promise chain
    return apiService.updateJob(jobId, data)
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

  // remove counts, times and status for cloning a job
  this.removeJobCounts = function (job) {
    delete job.status;
    delete job.counts;
    delete job.createTime;
    delete job.finishedTime;
    delete job.lastDataTime;
    delete job.modelSizeStats;
    delete job.schedulerStatus;
    delete job.averageBucketProcessingTimeMs;

    return job;
  };

  // find a job based on the id
  this.getJob = function (jobId) {
    let job;
    job = _.find(jobs, (job) => {
      return job.id === jobId;
    });

    return job;
  };

  // use elastic search to load the start and end timestamps
  // add them to our own promise object and return that rather than the search results object
  this.jobTimeRange = function (jobId) {
    const deferred = $q.defer();
    const obj = {success: true, start: {epoch:0, string:''}, end: {epoch:0, string:''}};

    es.search({
      index: 'prelertresults-' + jobId,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': 'jobId: ' + jobId,
                  'analyze_wildcard': true
                }
              },
              {'term': {'_type':'bucket'}}
            ]
          }
        },
        'aggs': {
          'earliest': {
            'min': {
              'field': '@timestamp'
            }
          },
          'latest': {
            'max': {
              'field': '@timestamp'
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
  // dashboards in the Prelert plugin. Returned response contains a jobs property,
  // which is an array of objects containing id, description, bucketSpan and detectorDescriptions,
  // plus a customUrls key if custom URLs have been configured for the job.
  this.getBasicJobInfo = function () {
    const that = this;
    const deferred = $q.defer();
    const obj = {success: true, jobs: []};

    ml.jobConfigs()
      .then(function (resp) {

        if (resp.jobs && resp.jobs.length > 0) {
          let detectorDescriptionsByJob = {};
          const detectorsByJob = {};
          const customUrlsByJob = {};

          _.each(resp.jobs, (jobObj) => {
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

            that.jobDescriptions[job.id] = job.description;
            detectorDescriptionsByJob[job.id] = job.detectorDescriptions;
            detectorsByJob[job.id] = job.detectors;
            that.basicJobs[job.id] = job;
            obj.jobs.push(job);
          });

          detectorDescriptionsByJob = anomalyUtils.labelDuplicateDetectorDescriptions(detectorDescriptionsByJob);
          _.each(detectorsByJob, (dtrs, jobId) => {
            _.each(dtrs, (dtr, i) => {
              dtr.detector_description = detectorDescriptionsByJob[jobId][i];
            });
          });
          that.detectorsByJob = detectorsByJob;
          that.customUrlsByJob = customUrlsByJob;
        }

        deferred.resolve(obj);

      }).catch(function (err) {
        console.log('getBasicJobInfo error getting list of jobs:', err);

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
              {'term': {'_type': 'categoryDefinition'}},
              {'term': {'jobId': jobId}},
              {'term': {'categoryId': categoryId}}
            ]
          }
        }
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        const source = _.first(resp.hits.hits)._source;
        obj.categoryId = source.categoryId;
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

  // use elastic search to load the scheduler state data
  // endTimeMillis is used to prepopulate the scheduler start modal
  // when a job has previously been set up with an end time
  this.jobSchedulerState = function (jobId) {
    const deferred = $q.defer();
    const obj = {startTimeMillis:null, endTimeMillis:null };

    es.search({
      index: 'prelertresults-' + jobId,
      size: 1,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'type': {
                  'value': 'schedulerState'
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
                'jobId': '' // catch system messages
              }
            },
            {
              'term': {
                'jobId': jobId // messages for specified jobId
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
          '@timestamp': {
            'gte': 'now-' + fromRange,
            'lte': 'now'
          }
        }
      };
    }

    es.search({
      index: 'prelert-int',
      size: 1000,
      body:
      {
        sort : [
          { '@timestamp' : {'order' : 'asc'}},
          { 'jobId' : {'order' : 'asc'}}
        ],
        'query': {
          'bool': {
            'filter': [
              {'term': {'_type': 'auditMessage'}},
              {
                'bool': {
                  'must_not': {
                    'term': {
                      'level': 'ACTIVITY'
                    }
                  }
                }
              },
              jobFilter, timeFilter
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
      deferred.resolve(messages);
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
      index: 'prelert-int',
      body: {
        'query': {
          'bool': {
            'filter': {
              'range': {
                '@timestamp': {
                  'gte': 'now-1d'
                }
              }
            }
          }
        },
        'aggs': {
          'levelsPerJob': {
            'terms': {
              'field': 'jobId',
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
                          'field': '@timestamp'
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
      deferred.resolve(aggs);
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

  this.searchPreview = function (indices, types, job) {
    const deferred = $q.defer();

    if (job.schedulerConfig) {
      const data = {
        index:indices,
        '&type': types.join(',')
      };
      const body = {};

      let query = { 'match_all': {} };
      // if query is set, add it to the search, otherwise use match_all
      if (job.schedulerConfig.query) {
        query = job.schedulerConfig.query;
      }
      body.query = query;

      // if aggs or aggregations is set, add it to the search
      const aggregations = job.schedulerConfig.aggs || job.schedulerConfig.aggregations;
      if (aggregations && Object.keys(aggregations).length) {
        body.size = 0;
        body.aggregations = aggregations;

        // add script_fields if present
        const scriptFields = job.schedulerConfig.script_fields;
        if (scriptFields && Object.keys(scriptFields).length) {
          body.script_fields = scriptFields;
        }

      } else {
        // if aggregations is not set and retrieveWholeSource is not set, add all of the fields from the job
        body.size = 10;

        if (!job.schedulerConfig.retrieveWholeSource) {

          // add script_fields if present
          const scriptFields = job.schedulerConfig.script_fields;
          if (scriptFields && Object.keys(scriptFields).length) {
            body.script_fields = scriptFields;
          }


          const fields = {};

          // get fields from detectors
          if (job.analysisConfig.detectors) {
            _.each(job.analysisConfig.detectors, (dtr) => {
              if (dtr.byFieldName) {
                fields[dtr.byFieldName] = {};
              }
              if (dtr.fieldName) {
                fields[dtr.fieldName] = {};
              }
              if (dtr.overFieldName) {
                fields[dtr.overFieldName] = {};
              }
              if (dtr.partitionFieldName) {
                fields[dtr.partitionFieldName] = {};
              }
            });
          }

          // get fields from influencers
          if (job.analysisConfig.influencers) {
            _.each(job.analysisConfig.influencers, (inf) => {
              fields[inf] = {};
            });
          }

          // get fields from categorizationFieldName
          if (job.analysisConfig.categorizationFieldName) {
            fields[job.analysisConfig.categorizationFieldName] = {};
          }

          // get fields from summaryCountFieldName
          if (job.analysisConfig.summaryCountFieldName) {
            fields[job.analysisConfig.summaryCountFieldName] = {};
          }

          // get fields from timeField
          if (job.dataDescription.timeField) {
            fields[job.dataDescription.timeField] = {};
          }

          // get fields from transform inputs
          if (job.transforms) {
            _.each(job.transforms, (trfm) => {
              _.each(trfm.inputs, (inp) => {
                fields[inp] = {};
              });
            });
          }

          // console.log('fields: ', fields);
          const fieldsList = Object.keys(fields);
          if (fieldsList.length) {
            body._source = fieldsList;
          }
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

  // server.maxPayloadBytes: <value>
  this.uploadData = function (jobId, data) {
    const deferred = $q.defer();
    if (jobId && data) {
      apiService.uploadJobData(jobId, data)
        .then((resp) => {
          // console.log(resp);
          deferred.resolve(resp);
        })
        .catch((resp) => {
          // console.log(resp);
          deferred.reject(resp);
        });
    } else {
      deferred.reject({});
    }
    return deferred.promise;
  };

  // start the scheduler for a given job
  // refresh the job status on start success
  this.startScheduler = function (jobId, params) {
    const deferred = $q.defer();
    const that = this;
    apiService.schedulerControl(jobId, 'start', params)
      .then((resp) => {
        // console.log(resp);
        // refresh the status for the job as it's now changed
        that.updateSingleJobCounts(jobId);
        // return resp;
        deferred.resolve(resp);

      }).catch((err) => {
        console.log('PrlJobsList error starting scheduler:', err);
        msgs.error('Could not start scheduler for ' + jobId);
        if (err.message) {
          msgs.error(err.message);
        }
        deferred.reject(err);
        // return err;
      });
    return deferred.promise;
  };

  // stop the scheduler for a given job
  // refresh the job status on stop success
  this.stopScheduler = function (jobId) {
    const deferred = $q.defer();
    const that = this;
    apiService.schedulerControl(jobId, 'stop')
      .then(function (resp) {
        // console.log(resp);
        // refresh the status for the job as it's now changed
        that.updateSingleJobCounts(jobId);
        deferred.resolve(resp);
        // return resp;

      }).catch(function (err) {
        console.log('PrlJobsList error stoping scheduler:', err);
        msgs.error('Could not stop scheduler for ' + jobId);
        if (err.message) {
          msgs.error(err.message);
        }
        deferred.reject(err);
        // return err;
      });
    return deferred.promise;
  };

  // true if the Engine API server is part
  // of a distributed group of nodes
  this.isDistributed = function () {
    const deferred = $q.defer();

    apiService.status()
      .then((resp) => {
        deferred.resolve(resp.engineHosts.length > 1);
      }).catch((err) => {
        console.log('isDistributed error', err);
        deferred.reject(err);
      });

    return deferred.promise;
  };

  // returns a map of job -> host
  // Only the actively running jobs are in the map
  this.jobHosts = function () {
    const deferred = $q.defer();

    apiService.status()
      .then((resp) => {
        deferred.resolve(resp.hostByJob);
      }).catch((err) => {
        console.log('jobHosts error', err);
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
        deferred.resolve(mappings);
      })
      .catch((resp) => {
        deferred.reject(resp);
      });

    return deferred.promise;
  };

  this.validateDetector = function (dtr) {
    const deferred = $q.defer();
    if (dtr) {
      apiService.validateDetector(dtr)
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

  this.validateTransforms = function (trfm) {
    const deferred = $q.defer();
    if (trfm) {
      apiService.validateTransforms(trfm)
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

  // simple function to load a single job without refreshing the version in the global jobs list
  this.loadJob = function (jobId) {
    return apiService.getJobDetails({jobId: jobId})
      .then((resp) => {
        // console.log('loadJob controller query response:', resp);
        let newJob = {};
        angular.copy(resp.document, newJob);
        return newJob;

      }).catch((err) => {
        console.log('loadJob: error getting job details for ' + jobId + ':', err);
        return null;
      });
  };

});
