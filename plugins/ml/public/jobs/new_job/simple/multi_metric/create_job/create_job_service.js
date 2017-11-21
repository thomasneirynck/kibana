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
import angular from 'angular';

import { EVENT_RATE_COUNT_FIELD } from 'plugins/ml/jobs/new_job/simple/components/constants/general';
import { ML_MEDIAN_PERCENTS } from 'plugins/ml/util/job_utils';
import { calculateTextWidth } from 'plugins/ml/util/string_utils';
import { IntervalHelperProvider } from 'plugins/ml/util/ml_time_buckets';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlMultiMetricJobService', function (
  $q,
  es,
  timefilter,
  Private,
  mlJobService,
  mlResultsService,
  mlSimpleJobSearchService) {

  const TimeBuckets = Private(IntervalHelperProvider);

  this.chartData = {
    job: {
      swimlane: [],
      line: [],
      bars: [],
    },
    detectors: {},
    percentComplete: 0,
    loadingDifference: 0,
    lastLoadTimestamp: null,
    highestValue: 0,
    eventRateHighestValue: 0,
    chartTicksMargin: { width: 30 }
  };
  this.job = {};

  this.clearChartData = function () {
    this.chartData.job.swimlane = [];
    this.chartData.job.line = [];
    this.chartData.job.bars = [];
    this.chartData.detectors = {};
    this.chartData.percentComplete = 0;
    this.chartData.loadingDifference = 0;
    this.chartData.highestValue = 0;
    this.chartData.eventRateHighestValue = 0;

    this.job = {};
  };

  this.getLineChartResults = function (formConfig, thisLoadTimestamp) {
    const deferred = $q.defer();

    const fieldIds = Object.keys(formConfig.fields).sort();

    // move event rate field to the front of the list
    const idx = _.findIndex(fieldIds, (id) => id === EVENT_RATE_COUNT_FIELD);
    if(idx !== -1) {
      fieldIds.splice(idx, 1);
      fieldIds.splice(0, 0, EVENT_RATE_COUNT_FIELD);
    }

    _.each(fieldIds, (fieldId) => {
      this.chartData.detectors[fieldId] = {
        line: [],
        swimlane: []
      };
    });

    const searchJson = getSearchJsonFromConfig(formConfig);

    es.search(searchJson)
    .then((resp) => {
      // if this is the last chart load, wipe all previous chart data
      if (thisLoadTimestamp === this.chartData.lastLoadTimestamp) {
        _.each(fieldIds, (fieldId) => {
          this.chartData.detectors[fieldId] = {
            line: [],
            swimlane: []
          };
        });
      } else {
        deferred.resolve(this.chartData);
      }
      const aggregationsByTime = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      let highestValue = Math.max(this.chartData.eventRateHighestValue, this.chartData.highestValue);

      _.each(aggregationsByTime, (dataForTime) => {
        const time = +dataForTime.key;
        const date = new Date(time);
        const docCount = +dataForTime.doc_count;

        this.chartData.job.swimlane.push({
          date: date,
          time: time,
          value: 0,
          color: '',
          percentComplete: 0
        });

        this.chartData.job.line.push({
          date: date,
          time: time,
          value: null,
        });

        _.each(fieldIds, (fieldId) => {
          let value;
          if (fieldId === EVENT_RATE_COUNT_FIELD) {
            value = docCount;
          } else if (typeof dataForTime[fieldId].value !== 'undefined') {
            value = dataForTime[fieldId].value;
          } else if (typeof dataForTime[fieldId].values !== 'undefined') {
            value = dataForTime[fieldId].values[ML_MEDIAN_PERCENTS];
          }

          if (!isFinite(value) || docCount === 0) {
            value = null;
          }

          if (value > highestValue) {
            highestValue = value;
          }

          if (this.chartData.detectors[fieldId]) {
            this.chartData.detectors[fieldId].line.push({
              date,
              time,
              value,
            });

            // init swimlane
            this.chartData.detectors[fieldId].swimlane.push({
              date,
              time,
              value: 0,
              color: '',
              percentComplete: 0
            });
          }
        });
      });

      this.chartData.highestValue = Math.ceil(highestValue);

      deferred.resolve(this.chartData);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  function getSearchJsonFromConfig(formConfig) {
    const interval = formConfig.chartInterval.getInterval().asMilliseconds() + 'ms';
    // clone the query as we're modifying it
    const query = _.cloneDeep(formConfig.combinedQuery);

    const json = {
      'index': formConfig.indexPattern.title,
      'size': 0,
      'body': {
        'query': {},
        'aggs': {
          'times': {
            'date_histogram': {
              'field': formConfig.timeField,
              'interval': interval,
              'min_doc_count': 0
            }
          }
        }
      }
    };

    query.bool.must.push({
      'range': {
        [formConfig.timeField]: {
          'gte': formConfig.start,
          'lte': formConfig.end,
          'format': formConfig.format
        }
      }
    });

    // if the data is partitioned, add an additional search term
    if (formConfig.firstSplitFieldName !== undefined) {
      query.bool.must.push({
        term: {
          [formConfig.splitField.name]: formConfig.firstSplitFieldName
        }
      });
    }

    json.body.query = query;

    if (Object.keys(formConfig.fields).length) {
      json.body.aggs.times.aggs = {};
      _.each(formConfig.fields, (field) => {
        if (field.id !== EVENT_RATE_COUNT_FIELD) {
          json.body.aggs.times.aggs[field.id] = {
            [field.agg.type.dslName]: { field: field.name }
          };

          if (field.agg.type.dslName === 'percentiles') {
            json.body.aggs.times.aggs[field.id][field.agg.type.dslName].percents = [ML_MEDIAN_PERCENTS];
          }
        }
      });
    }

    return json;
  }

  function getJobFromConfig(formConfig) {
    const job = mlJobService.getBlankJob();
    job.data_description.time_field = formConfig.timeField;

    _.each(formConfig.fields, (field, key) => {
      let func = field.agg.type.mlName;
      if (formConfig.isSparseData) {
        if (field.agg.type.dslName === 'count') {
          func = func.replace(/count/, 'non_zero_count');
        } else if(field.agg.type.dslName === 'sum') {
          func = func.replace(/sum/, 'non_null_sum');
        }
      }
      const dtr = {
        function: func
      };

      dtr.detector_description = func;

      if (key !== EVENT_RATE_COUNT_FIELD) {
        dtr.field_name = field.name;
        dtr.detector_description += `(${field.name})`;
      }

      if (formConfig.splitField !== undefined) {
        dtr.partition_field_name =  formConfig.splitField.name;
      }
      job.analysis_config.detectors.push(dtr);
    });

    const influencerFields = formConfig.influencerFields.map(f => f.name);
    if (influencerFields && influencerFields.length) {
      job.analysis_config.influencers = influencerFields;
    }

    let query = {
      match_all: {}
    };
    if (formConfig.query.query_string.query !== '*' || formConfig.filters.length) {
      query = formConfig.combinedQuery;
    }

    job.analysis_config.bucket_span = formConfig.bucketSpan;

    job.analysis_limits = {
      model_memory_limit: formConfig.modelMemoryLimit
    };

    delete job.data_description.field_delimiter;
    delete job.data_description.quote_character;
    delete job.data_description.time_format;
    delete job.data_description.format;

    job.datafeed_config = {
      query,
      indices: [formConfig.indexPattern.title],
    };
    job.job_id = formConfig.jobId;
    job.description = formConfig.description;
    job.groups = formConfig.jobGroups;

    if (formConfig.useDedicatedIndex) {
      job.results_index_name = job.job_id;
    }

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
    const datafeedId = mlJobService.getDatafeedId(formConfig.jobId);
    return mlJobService.startDatafeed(datafeedId, formConfig.jobId, formConfig.start, formConfig.end);
  };

  this.stopDatafeed = function (formConfig) {
    const datafeedId = mlJobService.getDatafeedId(formConfig.jobId);
    return mlJobService.stopDatafeed(datafeedId, formConfig.jobId);
  };

  this.checkDatafeedStatus = function (formConfig) {
    return mlJobService.updateSingleJobDatafeedState(formConfig.jobId);
  };


  this.loadJobSwimlaneData = function (formConfig) {
    const deferred = $q.defer();

    mlResultsService.getScoresByBucket(
      [formConfig.jobId],
      formConfig.start,
      formConfig.end,
      formConfig.resultsIntervalSeconds + 's',
      1
    )
    .then((data) => {
      let time = formConfig.start;

      const jobResults = data.results[formConfig.jobId];

      _.each(jobResults, (value, t) => {
        time = +t;
        const date = new Date(time);
        this.chartData.job.swimlane.push({
          date,
          time,
          value,
          color: ''
        });
      });

      const pcnt = ((time -  formConfig.start + formConfig.resultsIntervalSeconds) / (formConfig.end - formConfig.start) * 100);

      this.chartData.percentComplete = Math.round(pcnt);
      this.chartData.job.percentComplete = this.chartData.percentComplete;
      this.chartData.job.swimlaneInterval = formConfig.resultsIntervalSeconds * 1000;

      deferred.resolve(this.chartData);
    })
    .catch(() => {
      deferred.resolve(this.chartData);
    });

    return deferred.promise;
  };

  this.loadDetectorSwimlaneData = function (formConfig) {
    const deferred = $q.defer();

    mlSimpleJobSearchService.getScoresByRecord(
      formConfig.jobId,
      formConfig.start,
      formConfig.end,
      formConfig.resultsIntervalSeconds + 's',
      {
        name: (formConfig.splitField !== undefined) ? formConfig.splitField.name : undefined,
        value: formConfig.firstSplitFieldName
      }
    )
    .then((data) => {
      let dtrIndex = 0;
      _.each(formConfig.fields, (field, key) => {

        const dtr = this.chartData.detectors[key];
        const times = data.results[dtrIndex];

        dtr.swimlane = [];
        _.each(times, (timeObj, t) => {
          const time = +t;
          const date = new Date(time);
          dtr.swimlane.push({
            date: date,
            time: time,
            value: timeObj.recordScore,
            color: ''
          });
        });

        dtr.percentComplete = this.chartData.percentComplete;
        dtr.swimlaneInterval = formConfig.resultsIntervalSeconds * 1000;

        dtrIndex++;
      });

      deferred.resolve(this.chartData);
    })
    .catch(() => {
      deferred.resolve(this.chartData);
    });

    return deferred.promise;
  };

  this.getSplitFields = function (formConfig, size) {
    const query = formConfig.combinedQuery;
    return mlSimpleJobSearchService.getCategoryFields(
      formConfig.indexPattern.title,
      formConfig.splitField.name,
      size,
      query);
  };

  this.loadDocCountData = function (formConfig) {
    const deferred = $q.defer();
    const query = formConfig.combinedQuery;
    const bounds = timefilter.getActiveBounds();
    const buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);

    const interval = buckets.getInterval().asMilliseconds();

    const end = formConfig.end;
    const start = formConfig.start;

    mlResultsService.getEventRateData(
      formConfig.indexPattern.title,
      query,
      formConfig.timeField,
      start,
      end,
      (interval + 'ms'))
    .then((resp) => {
      let highestValue = Math.max(this.chartData.eventRateHighestValue, this.chartData.highestValue);
      this.chartData.job.bars = [];

      _.each(resp.results, (value, t) => {
        if (!isFinite(value)) {
          value = 0;
        }

        if (value > highestValue) {
          highestValue = value;
        }

        const time = +t;
        const date = new Date(time);
        this.chartData.job.barsInterval = interval;
        this.chartData.job.bars.push({
          date,
          time,
          value,
        });
      });

      this.chartData.eventRateHighestValue = Math.ceil(highestValue);

      deferred.resolve(this.chartData);
    }).catch((resp) => {
      console.log('getEventRate visualization - error getting event rate data from elasticsearch:', resp);
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.updateChartMargin = function () {
    // Append extra 10px to width of tick label for highest axis value to allow for tick padding.
    this.chartData.chartTicksMargin.width = calculateTextWidth(this.chartData.eventRateHighestValue, true) + 10;
  };

});
