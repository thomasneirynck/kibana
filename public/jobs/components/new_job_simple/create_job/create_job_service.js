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

import moment from 'moment';
import _ from 'lodash';
import 'ui/timefilter';

import anomalyUtils from 'plugins/ml/util/anomaly_utils';
import stringUtils from 'plugins/ml/util/string_utils';
import jobUtils from 'plugins/ml/util/job_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.service('mlSimpleJobService', function (
  $q,
  es,
  timefilter,
  Private,
  mlJobService,
  mlSimpleJobSearchService,
  mlESMappingService) {
  const TimeBuckets = Private(require('ui/time_buckets'));

  this.chartData = {
    line: [],
    model: [],
    swimlane: [],
    hasBounds: false,
    percentComplete: 0,
    loadingDiffernce: 0,
    anomalyMode: 'dna' //'dots'
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

  function mergeChartResults(chartData) {
    // Combine the data from the two sets to add anomalyScore properties
    // to the chartData entries for anomalous buckets.
    _.each(chartData.swimlane, function (bucket) {
      if (bucket.value > 0) {
        // Assume bucket times match in each data set for the majority of cases.
        // If not (e.g. interim results?) need to find closest time in chartData set.
        const bucketTime = bucket.date.getTime();
        let chartPoint;
        for (let i = 0; i < chartData.length; i++) {
          if (chartData[i].date.getTime() === bucketTime) {
            chartPoint = chartData[i];
            break;
          }
        }

        if (chartPoint === undefined) {
          // Find nearest point in time.
          // loop through line items until the date is greater than bucketTime
          // grab the current and prevous items in the and compare the time differences
          let foundItem;
          for (let i = 0; i < chartData.line.length; i++) {
            const itemTime = chartData.line[i].date.getTime();
            if (itemTime > bucketTime) {
              const item = chartData.line[i];
              const prevousItem = chartData.line[i - 1];

              const diff1 = Math.abs(bucketTime - prevousItem.date.getTime());
              const diff2 = Math.abs(bucketTime - itemTime);

              // foundItem should be the item with a date closest to bucketTime
              if (prevousItem === undefined || diff1 > diff2) {
                foundItem = item;
              } else {
                foundItem = prevousItem;
              }
              break;
            }
          }
          chartPoint = foundItem;
        }

        if (chartPoint !== undefined) {
          chartPoint.anomalyScore = bucket.value;
        } else {
          // Bucket data (chartData.swimlane) may have an extra point than model debug data (chartData.line),
          // e.g. right at the end of a job. In this case set the score for the last chart point to
          // that of the last bucket, if that bucket has a higher score.
          const lastLineChartPoint = chartData.line[chartData.line.length - 1];
          const lastLineChartPointScore = lastLineChartPoint.anomalyScore || 0;
          lastLineChartPoint.anomalyScore = Math.max(lastLineChartPointScore, bucket.value);
        }
      }
    });
  }

  function getSearchJsonFromConfig(formConfig) {
    const interval = formConfig.chartInterval.getInterval().asSeconds() + 's';
    const json = {
      'index': formConfig.indexPattern.id,
      'size': 0,
      'body': {
        'query': {
          'bool': {
            // 'must': [
            'filter': [
              {
                'query_string': {
                  'analyze_wildcard': true,
                  'query': '*' // CHANGEME
                }
              },
              {
                'range': {
                  [formConfig.timeField.name]: {
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
              'field': formConfig.timeField.displayName,
              'interval': interval,
              // 'interval': '3h',
              // 'interval': '300s',
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
  };

  function getJobFromConfig(formConfig) {
    const bucketSpan = formConfig.jobInterval.getInterval().asSeconds();

    const mappingTypes = formConfig.mappingTypes;

    const job = mlJobService.getBlankJob();
    job.data_description.time_field = formConfig.timeField.name;
    job.data_description.time_format = formConfig.format;

    // job.analysis_config.influencers.push(obj.params.field);

    const dtr = {
      function: formConfig.agg.type.mlName
    };

    if (formConfig.field && formConfig.field.displayName) {
      dtr.field_name = formConfig.field.displayName;
    }
    job.analysis_config.detectors.push(dtr);
    job.analysis_config.bucket_span = bucketSpan;

    job.data_description.format = 'ELASTICSEARCH';
    delete job.data_description.field_delimiter;
    delete job.data_description.quote_character;

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
      bounds_percentile: 95.0,
      write_to : 'data_store'
    };

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

    const index = formConfig.indexPattern.id;
    const types = formConfig.mappingTypes.join(',');

    mlJobService.searchTimeFields(index, types, job.data_description.time_field)
    .then((resp) => {
      job.data_description.time_format = stringUtils.guessTimeFormat(resp.time);

      // DO THE SAVE
      mlJobService.saveNewJob(job, true)
      .then((resp) => {
        // console.log('createJob: ', resp);
        if (resp.success) {
          deferred.resolve(this.job);
        } else {
          deferred.reject(resp);
        }
      });
    })
    .catch((resp) => {
      // msgs.error('Error, time format could not be guessed.');
      // msgs.error(resp.message);
      deferred.reject(resp);
      console.log('guessTimeFormat: times could not be loaded ', resp.message);
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

  this.checkDatafeedStatus = function (formConfig) {
    return mlJobService.updateSingleJobDatafeedStatus(formConfig.jobId);
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

    mlSimpleJobSearchService.getModelDebugOutput(
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

    mlSimpleJobSearchService.getScoresByBucket(
      formConfig.indexPattern.id,
      [formConfig.jobId],
      formConfig.start,
      formConfig.end,
      formConfig.chartInterval.getInterval().asSeconds() + 's'
    )
    .then(data => {
      const oldSwimlaneLength = this.chartData.swimlane.length;
      this.chartData.swimlane = processSwimlaneResults(data.results);
      if (this.chartData.anomalyMode === 'dots') {
        mergeChartResults(this.chartData);
      }

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

  this.getTimeFields = function (indexPattern) {
    // const fields = _.filter(indexPattern.fields.raw, 'aggregatable');
    const fields = indexPattern.fields;
    const timeFields = _.filter(fields, (f) => {return f.type === 'date';});
    return timeFields;
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
