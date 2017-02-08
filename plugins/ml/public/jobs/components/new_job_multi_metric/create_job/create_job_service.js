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

module.service('mlMultiMetricJobService', function (
  $q,
  es,
  timefilter,
  Private,
  mlJobService,
  mlMultiMetricJobSearchService) {

  this.chartData = {
    job: {
      swimlane: [],
      line: [],
    },
    detectors: {},
    percentComplete: 0,
    loadingDifference: 0
  };
  this.job = {};

  this.getLineChartResults = function (formConfig) {
    const deferred = $q.defer();

    const fields = Object.keys(formConfig.fields).sort();
    this.chartData.job.swimlane = [];
    this.chartData.job.line = [];
    this.chartData.detectors = {};
    this.chartData.percentComplete = 0;
    this.chartData.loadingDifference = 0;

    _.each(fields, (field) => {
      this.chartData.detectors[field] = {
        line: [],
        swimlane:[]
      };
    });

    const searchJson = getSearchJsonFromConfig(formConfig);

    es.search(searchJson)
    .then((resp) => {
      console.log('Time series search service getLineChartResults() resp:', resp);

      const aggregationsByTime = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      _.each(aggregationsByTime, (dataForTime) => {
        const time = +dataForTime.key;
        const date = new Date(time);

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

        _.each(fields, (field) => {
          const value = dataForTime[field].value;

          this.chartData.detectors[field].line.push({
            date: date,
            time: time,
            value: (isFinite(value)) ? value : 0,
          });

          // init swimlane
          this.chartData.detectors[field].swimlane.push({
            date: date,
            time: time,
            value: 0,
            color: '',
            percentComplete: 0
          });
        });
      });
      deferred.resolve(this.chartData);
    })
    .catch(function (resp) {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

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

    if (Object.keys(formConfig.fields).length) {
      json.body.aggs.times.aggs = {};
      _.each(formConfig.fields, (field) => {
        json.body.aggs.times.aggs[field.id] = {
          [field.agg.type.name]: {field: field.id}
        };
      });
    }

    return json;
  }

  function getJobFromConfig(formConfig) {
    const bucketSpan = formConfig.jobInterval.getInterval().asSeconds();

    const mappingTypes = formConfig.mappingTypes;

    const job = mlJobService.getBlankJob();
    job.data_description.time_field = formConfig.timeField;

    // job.analysis_config.influencers.push(obj.params.field);

    _.each(formConfig.fields, (field, key) => {
      const func = field.agg.type.mlName;
      const dtr = {
        function: func,
        field_name: key,
      };
      if (formConfig.splitField !== '--No split--') {
        dtr.partition_field_name =  formConfig.splitField;
      }
      job.analysis_config.detectors.push(dtr);
    });

    const keyFields = Object.keys(formConfig.keyFields);
    if (keyFields && keyFields.length) {
      job.analysis_config.influencers = keyFields;
    }

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

  this.checkDatafeedStatus = function (formConfig) {
    return mlJobService.updateSingleJobDatafeedState(formConfig.jobId);
  };


  this.loadJobSwimlaneData = function (formConfig) {
    const deferred = $q.defer();

    mlMultiMetricJobSearchService.getScoresByBucket(
      formConfig.indexPattern.id,
      [formConfig.jobId],
      formConfig.start,
      formConfig.end,
      formConfig.chartInterval.getInterval().asSeconds() + 's'
    )
    .then(data => {
      const oldSwimlaneLength = this.chartData.job.swimlane.length;
      // this.chartData.job.swimlane = processSwimlaneResults(data.results);

      // const swimlaneData = [];
      _.each(data.results, (dataForTime, t) => {
        const time = +t;
        const date = new Date(time);
        this.chartData.job.swimlane.push({
          date: date,
          time: time,
          value: dataForTime.anomalyScore,
          color: ''
        });
      });

      // store the number of results buckets that have just been loaded
      // this is used to vary the results request interval.
      // i.e. if no buckets or only a coulple were loaded, wait a bit longer before
      // loading the results next time
      this.chartData.job.loadingDifference = this.chartData.job.swimlane.length - oldSwimlaneLength;

      if (false && this.chartData.job.line.length) {
        this.chartData.job.hasBounds = true;

        // work out the percent complete of the running job
        // based on the total length of time of the orgininal search
        // and the length of time of the results loaded so far
        const min = this.chartData.job.line[0].time;
        const max = this.chartData.job.line[this.chartData.job.line.length - 1].time;
        const diff = max - min;

        if (this.chartData.job.swimlane.length) {
          const diff2 = this.chartData.job.swimlane[this.chartData.job.swimlane.length - 1].time - min;
          const pcnt = ((diff2 / diff) * 100);
          this.chartData.job.percentComplete = pcnt;
        }
      }

      deferred.resolve(this.chartData);
    })
    .catch(() => {
      deferred.resolve(this.chartData);
    });

    return deferred.promise;
  };

  this.loadDetectorSwimlaneData = function (formConfig) {
    const deferred = $q.defer();

    mlMultiMetricJobSearchService.getScoresByRecord(
      formConfig.indexPattern.id,
      [formConfig.jobId],
      formConfig.start,
      formConfig.end,
      formConfig.chartInterval.getInterval().asSeconds() + 's'
    )
    .then((data) => {
      let firstChart;
      let oldSwimlaneLength = 0;

      let i = 0;
      _.each(formConfig.fields, (field, key) => {
        if (i === 0) {
          oldSwimlaneLength = this.chartData.detectors[key].swimlane.length;
        }
        // const func = field.agg.type.mlName;
        const times = data.results[i];

        // console.log(key + ' - ' + this.chartData.detectors[key].swimlane.length);

        this.chartData.detectors[key].swimlane = [];
        _.each(times, (timeObj, t) => {
          const time = +t;
          const date = new Date(time);
          this.chartData.detectors[key].swimlane.push({
            date: date,
            time: time,
            value: timeObj.normalizedProbability,
            color: ''
          });
        });

        if (i === 0) {
          firstChart = this.chartData.detectors[key];
        }

        i++;
      });

      // store the number of results buckets that have just been loaded
      // this is used to vary the results request interval.
      // i.e. if no buckets or only a coulple were loaded, wait a bit longer before
      // loading the results next time

      if (firstChart.line && firstChart.line.length) {
        this.chartData.loadingDifference = firstChart.swimlane.length - oldSwimlaneLength;
        // work out the percent complete of the running job
        // based on the total length of time of the orgininal search
        // and the length of time of the results loaded so far
        const min = firstChart.line[0].time;
        const max = firstChart.line[firstChart.line.length - 1].time;
        const diff = max - min;

        if (firstChart.swimlane.length) {
          const diff2 = firstChart.swimlane[firstChart.swimlane.length - 1].time - min;
          const pcnt = ((diff2 / diff) * 100);

          _.each(this.chartData.detectors, (chart) => {
            chart.percentComplete = pcnt;
          });
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

  this.getSplitFields = function (formConfig, size) {
    return mlMultiMetricJobSearchService.getCategoryFields(formConfig.indexPattern.id, formConfig.splitField, size);
  };


});