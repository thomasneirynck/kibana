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
import 'ui/timefilter';

import jobUtils from 'plugins/ml/util/job_utils';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlSingleMetricJobService', function (
  $q,
  es,
  timefilter,
  Private,
  mlJobService,
  mlSingleMetricJobSearchService) {

  this.chartData = {
    line: [],
    model: [],
    swimlane: [],
    hasBounds: false,
    percentComplete: 0,
    loadingDiffernce: 0
  };
  this.job = {};

  this.getLineChartResults = function (formConfig) {
    const deferred = $q.defer();

    this.chartData.line = [];
    this.chartData.model = [];
    this.chartData.swimlane = [];
    this.chartData.hasBounds = false;
    this.chartData.percentComplete = 0;
    this.chartData.loadingDifference = 0;

    const obj = {
      success: true,
      results: {}
    };

    const searchJson = getSearchJsonFromConfig(formConfig);

    es.search(searchJson)
    .then((resp) => {
      console.log('Time series search service getLineChartResults() resp:', resp);

      const aggregationsByTime = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      _.each(aggregationsByTime, (dataForTime) => {
        const time = dataForTime.key;
        let value = _.get(dataForTime, ['field_value', 'value']);
        if (value === undefined && formConfig.field === null) {
          value = dataForTime.doc_count;
        }
        obj.results[time] = {
          actual: (isFinite(value)) ? value : 0,
        };
      });

      this.chartData.line = processLineChartResults(obj.results);
      this.chartData.swimlane = processSwimlaneResults(obj.results, true);
      deferred.resolve(this.chartData.line);
    })
    .catch(function (resp) {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  function processLineChartResults(data) {
    // create a dataset in format used by the model debug chart.
    // create empty swimlane dataset
    // i.e. array of Objects with keys date (JavaScript date), value, lower and upper.
    const lineData = [];
    _.each(data, (dataForTime, t) => {
      const time = +t;
      const date = new Date(time);
      lineData.push({
        date: date,
        time: time,
        lower: dataForTime.debugLower,
        value: dataForTime.actual,
        upper: dataForTime.debugUpper
      });
    });

    return lineData;
  }

  function processSwimlaneResults(bucketScoreData, init) {
    // create a dataset in format used by the model debug chart.
    // create empty swimlane dataset
    // i.e. array of Objects with keys date (JavaScript date), value, lower and upper.
    const swimlaneData = [];
    _.each(bucketScoreData, (dataForTime, t) => {
      const time = +t;
      const date = new Date(time);
      swimlaneData.push({
        date: date,
        time: time,
        value: init ? 0 : dataForTime.anomalyScore,
        color: ''
      });
    });
    return swimlaneData;
  }

  function getSearchJsonFromConfig(formConfig) {
    const interval = formConfig.chartInterval.getInterval().asSeconds() + 's';
    const json = {
      'index': formConfig.indexPattern.id,
      'size': 0,
      'body': {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'analyze_wildcard': true,
                  'query': '*' // CHANGEME
                }
              },
              {
                'range': {
                  [formConfig.timeField]: {
                    'gte': formConfig.start,
                    'lte': formConfig.end,
                    'format': formConfig.format
                  }
                }
              }
            ]
          }
        },
        'aggs': {
          'times': {
            'date_histogram': {
              'field': formConfig.timeField,
              'interval': interval,
              'min_doc_count': 1
            }
          }
        }
      }
    };

    if (formConfig.field !== null) {
      json.body.aggs.times.aggs = {
        'field_value':{
          [formConfig.agg.type.name]: {field: formConfig.field.displayName}
        }
      };
    }

    return json;
  }

  function getJobFromConfig(formConfig) {
    const bucketSpan = formConfig.jobInterval.getInterval().asSeconds();

    const mappingTypes = formConfig.mappingTypes;

    const job = mlJobService.getBlankJob();
    job.data_description.time_field = formConfig.timeField;

    const dtr = {
      function: formConfig.agg.type.mlName
    };

    if (formConfig.field && formConfig.field.displayName) {
      dtr.field_name = formConfig.field.displayName;
    }
    job.analysis_config.detectors.push(dtr);
    job.analysis_config.bucket_span = bucketSpan;

    delete job.data_description.field_delimiter;
    delete job.data_description.quote_character;
    delete job.data_description.time_format;
    delete job.data_description.format;

    job.datafeed_config = {
      query: {
        match_all: {}
      },
      types: mappingTypes,
      query_delay: 60,
      frequency: jobUtils.calculateDatafeedFrequencyDefault(bucketSpan),
      indexes: [formConfig.indexPattern.id],
      scroll_size: 1000
    };

    job.job_id = formConfig.jobId;
    job.description = formConfig.description;

    job.model_debug_config =  {
      bounds_percentile: 95.0
    };

    if (dtr.function === 'count') {
      job.analysis_config.summary_count_field_name = 'doc_count';

      job.datafeed_config.aggregations = {
        [formConfig.timeField]: {
          histogram: {
            field: formConfig.timeField,
            interval: bucketSpan * 1000,
            offset: 0,
            order: {
              _key: 'asc'
            },
            keyed: false,
            min_doc_count: 0
          }
        }
      };
    } else if(dtr.function === 'mean') {
      job.analysis_config.summary_count_field_name = 'doc_count';

      job.datafeed_config.aggregations = {
        [formConfig.timeField]: {
          histogram: {
            field: formConfig.timeField,
            interval: bucketSpan * 1000,
            offset: 0,
            order: {
              _key: 'asc'
            },
            keyed: false,
            min_doc_count: 0
          },
          aggregations: {
            [dtr.field_name]: {
              avg: {
                field: dtr.field_name
              }
            }
          }
        }
      };
    }

    console.log('auto created job: ', job);

    return job;
  }

  function createJobForSaving(job) {
    const newJob = angular.copy(job);
    delete newJob.datafeed_config;
    return newJob;
  }

  this.createJob = function (formConfig) {
    const deferred = $q.defer();

    this.job = getJobFromConfig(formConfig);
    const job = createJobForSaving(this.job);

    // DO THE SAVE
    mlJobService.saveNewJob(job)
    .then((resp) => {
      if (resp.success) {
        deferred.resolve(this.job);
      } else {
        deferred.reject(resp);
      }
    });

    return deferred.promise;
  };

  this.startDatafeed = function (formConfig) {
    const datafeedId = 'datafeed-' + formConfig.jobId;
    return mlJobService.startDatafeed(datafeedId, formConfig.jobId, formConfig.start, formConfig.end);
  };

  this.stopDatafeed = function (formConfig) {
    const datafeedId = 'datafeed-' + formConfig.jobId;
    return mlJobService.stopDatafeed(datafeedId, formConfig.jobId);
  };

  this.checkDatafeedState = function (formConfig) {
    return mlJobService.updateSingleJobDatafeedState(formConfig.jobId);
  };

  this.loadModelData = function (formConfig) {
    const deferred = $q.defer();

    let start = formConfig.start;

    if (this.chartData.model.length > 5) {
      // only load the model since the end of the last time we checked
      // but discard the last 5 buckets in case the model has changed
      start = this.chartData.model[this.chartData.model.length - 5].time;
      for (let i = 0; i < 5; i++) {
        this.chartData.model.pop();
      }
    }

    mlSingleMetricJobSearchService.getModelDebugOutput(
      formConfig.indexPattern.id,
      [formConfig.jobId],
      start,
      formConfig.end,
      formConfig.chartInterval.getInterval().asSeconds() + 's',
      formConfig.agg.type.mlDebugAgg
    )
    .then(data => {
      this.chartData.model = this.chartData.model.concat(processLineChartResults(data.results));
      deferred.resolve(this.chartData);
    })
    .catch(() => {
      deferred.reject(this.chartData);
    });

    return deferred.promise;
  };

  this.loadSwimlaneData = function (formConfig) {
    const deferred = $q.defer();

    mlSingleMetricJobSearchService.getScoresByBucket(
      formConfig.indexPattern.id,
      [formConfig.jobId],
      formConfig.start,
      formConfig.end,
      formConfig.chartInterval.getInterval().asSeconds() + 's'
    )
    .then(data => {
      const oldSwimlaneLength = this.chartData.swimlane.length;
      this.chartData.swimlane = processSwimlaneResults(data.results);

      // store the number of results buckets that have just been loaded
      // this is used to vary the results request interval.
      // i.e. if no buckets or only a coulple were loaded, wait a bit longer before
      // loading the results next time
      this.chartData.loadingDifference = this.chartData.swimlane.length - oldSwimlaneLength;

      if (this.chartData.line.length) {
        this.chartData.hasBounds = true;

        // work out the percent complete of the running job
        // based on the total length of time of the orgininal search
        // and the length of time of the results loaded so far
        const min = this.chartData.line[0].time;
        const max = this.chartData.line[this.chartData.line.length - 1].time;
        const diff = max - min;

        if (this.chartData.swimlane.length) {
          const diff2 = this.chartData.swimlane[this.chartData.swimlane.length - 1].time - min;
          const pcnt = ((diff2 / diff) * 100);
          this.chartData.percentComplete = pcnt;
        }
      }

      deferred.resolve(this.chartData);
    })
    .catch(() => {
      deferred.resolve(this.chartData);
    });

    return deferred.promise;
  };

  this.indexTimeRange = function (indexPattern) {
    const deferred = $q.defer();
    const obj = {success: true, start: {epoch:0, string:''}, end: {epoch:0, string:''}};

    es.search({
      index: indexPattern.id,
      size: 0,
      body: {
        'aggs': {
          'earliest': {
            'min': {
              'field': indexPattern.timeFieldName
            }
          },
          'latest': {
            'max': {
              'field': indexPattern.timeFieldName
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
});