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
import 'ui/timefilter';

import { parseInterval } from 'ui/utils/parse_interval';

import { EVENT_RATE_COUNT_FIELD } from 'plugins/ml/jobs/new_job/simple/components/constants/general';
import { calculateDatafeedFrequencyDefaultSeconds, ML_MEDIAN_PERCENTS } from 'plugins/ml/util/job_utils';
import { calculateTextWidth } from 'plugins/ml/util/string_utils';
import { IntervalHelperProvider } from 'plugins/ml/util/ml_time_buckets';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlPopulationJobService', function (
  $q,
  es,
  timefilter,
  Private,
  mlJobService,
  mlResultsService,
  mlSimpleJobSearchService) {

  const TimeBuckets = Private(IntervalHelperProvider);
  const OVER_FIELD_EXAMPLES_COUNT = 40;

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

    const fieldIds = formConfig.fields.map(f => f.id);

    // move event rate field to the front of the list
    const idx = _.findIndex(fieldIds, (id) => id === EVENT_RATE_COUNT_FIELD);
    if(idx !== -1) {
      fieldIds.splice(idx, 1);
      fieldIds.splice(0, 0, EVENT_RATE_COUNT_FIELD);
    }

    fieldIds.forEach((fieldId, i) => {
      this.chartData.detectors[i] = {
        line: [],
        swimlane: []
      };
    });

    const searchJson = getSearchJsonFromConfig(formConfig);

    es.search(searchJson)
    .then((resp) => {
      // if this is the last chart load, wipe all previous chart data
      if (thisLoadTimestamp === this.chartData.lastLoadTimestamp) {
        fieldIds.forEach((fieldId, i) => {
          this.chartData.detectors[i] = {
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

        fieldIds.forEach((fieldId, i) => {
          const populationBuckets = _.get(dataForTime, ['population', 'buckets'], []);
          const values = [];
          if (fieldId === EVENT_RATE_COUNT_FIELD) {
            populationBuckets.forEach(b => {
              // check to see if the data is split.
              if (b[i] === undefined) {
                values.push({ label: b.key, value: b.doc_count });
              } else {
                // a split is being used, so an additional filter was added to the search
                values.push({ label: b.key, value: b[i].doc_count });
              }
            });
          } else if (typeof dataForTime.population !== 'undefined') {
            populationBuckets.forEach(b => {
              const tempBucket = b[i];
              let value = null;
              // check to see if the data is split
              // if the field has been split, an additional filter and aggregation
              // has been added to the search in the form of splitValue
              const tempValue = (tempBucket.value === undefined && tempBucket.splitValue !== undefined) ?
                tempBucket.splitValue : tempBucket;

              // check to see if values is exists rather than value.
              // if values exists, the aggregation was median
              if (tempValue.value === undefined && tempValue.values !== undefined) {
                value = tempValue.values[ML_MEDIAN_PERCENTS];
              } else {
                value = tempValue.value;
              }
              values.push({ label: b.key, value: (isFinite(value) ? value : null) });
            });
          }

          const highestValueField = _.reduce(values, (p, c) => (c.value > p.value) ? c : p, { value: 0 });
          if (highestValueField.value > highestValue) {
            highestValue = highestValueField.value;
          }

          if (this.chartData.detectors[i]) {
            this.chartData.detectors[i].line.push({
              date,
              time,
              values,
            });

            // init swimlane
            this.chartData.detectors[i].swimlane.push({
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
    const bounds = timefilter.getActiveBounds();
    const buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);

    const interval = buckets.getInterval().asMilliseconds();

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

    // NOTE, disabled for now. this may return it global partitioning is wanted.
    // if the data is partitioned, add an additional search term
    // if (formConfig.firstSplitFieldName !== undefined) {
    //   query.bool.must.push({
    //     term: {
    //       [formConfig.splitField] : formConfig.firstSplitFieldName
    //     }
    //   });
    // }

    json.body.query = query;

    if (formConfig.fields.length) {
      const aggs = {};
      formConfig.fields.forEach((field, i) => {
        if (field.id === EVENT_RATE_COUNT_FIELD) {
          if (field.splitField !== undefined) {
            // the event rate chart is draw using doc_values, so no need to specify a field.
            // however. if the event rate field is split, add a filter to just match the
            // fields which match the first split value (the front chart)
            aggs[i] = {
              filter: {
                term: {
                  [field.splitField.name]: field.firstSplitFieldName
                }
              }
            };
          }
        } else {
          if (field.splitField !== undefined) {
            // if the field is split, add a filter to the aggregation to just select the
            // fields which match the first split value (the front chart)
            aggs[i] = {
              filter: {
                term: {
                  [field.splitField.name]: field.firstSplitFieldName
                }
              },
              aggs: {
                splitValue: {
                  [field.agg.type.dslName]: { field: field.name }
                }
              }
            };
            if (field.agg.type.dslName === 'percentiles') {
              aggs[i].aggs.splitValue[field.agg.type.dslName].percents = [ML_MEDIAN_PERCENTS];
            }
          } else {
            aggs[i] = {
              [field.agg.type.dslName]: { field: field.name }
            };

            if (field.agg.type.dslName === 'percentiles') {
              aggs[i][field.agg.type.dslName].percents = [ML_MEDIAN_PERCENTS];
            }
          }

        }
      });

      if (formConfig.overField !== undefined) {
        // the over field should not be undefined. the user should not have got this far if it is.
        // add the wrapping terms based aggregation to divide the results up into
        // over field values.
        // we just want the first 40, or whatever OVER_FIELD_EXAMPLES_COUNT is set to.
        json.body.aggs.times.aggs = {
          population: {
            terms: {
              field: formConfig.overField.name,
              size: OVER_FIELD_EXAMPLES_COUNT
            },
            aggs
          }
        };
      } else {
        json.body.aggs.times.aggs = aggs;
      }
    }

    return json;
  }

  function getJobFromConfig(formConfig) {
    const mappingTypes = formConfig.mappingTypes;

    const job = mlJobService.getBlankJob();
    job.data_description.time_field = formConfig.timeField;

    formConfig.fields.forEach(field => {
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

      if (field.id !== EVENT_RATE_COUNT_FIELD) {
        dtr.field_name = field.name;
        dtr.detector_description += `(${field.name})`;
      }

      if (field.splitField !== undefined) {
        dtr.by_field_name = field.splitField.name;
        dtr.detector_description += ` by ${dtr.by_field_name}`;
      }

      if (formConfig.overField !== undefined) {
        dtr.over_field_name = formConfig.overField.name;
        dtr.detector_description += ` over ${dtr.over_field_name}`;
      }
      // if (formConfig.splitField !== undefined) {
      //   dtr.partition_field_name =  formConfig.splitField;
      // }
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

    delete job.data_description.field_delimiter;
    delete job.data_description.quote_character;
    delete job.data_description.time_format;
    delete job.data_description.format;

    const bucketSpanSeconds = parseInterval(formConfig.bucketSpan).asSeconds();

    job.datafeed_config = {
      query,
      types: mappingTypes,
      frequency: calculateDatafeedFrequencyDefaultSeconds(bucketSpanSeconds) + 's',
      indices: [formConfig.indexPattern.title],
      scroll_size: 1000
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
    console.log(job);
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

  this.getSplitFields = function (formConfig, splitFieldName, size) {
    const query = formConfig.combinedQuery;
    return mlSimpleJobSearchService.getCategoryFields(
      formConfig.indexPattern.title,
      splitFieldName,
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
