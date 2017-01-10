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

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.service('prlSimpleJobSearchService', function ($q, es) {

  this.getScoresByBucket = function (index, jobIds, earliestMs, latestMs, interval) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      results: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        'timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });

    let indexString = '';

    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, function (jobId, i) {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
          indexString += ',';
        }
        jobIdFilterStr += 'job_id:';
        jobIdFilterStr += jobId;

        indexString += '.ml-anomalies-' + jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard': true,
          'query': jobIdFilterStr
        }
      });
    }

    es.search({
      index: indexString,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [{
              'query_string': {
                'query': '_type:result AND result_type:bucket',
                'analyze_wildcard': true
              }
            }, {
              'bool': {
                'must': boolCriteria
              }
            }]
          }
        },
        'aggs': {
          'times': {
            'date_histogram': {
              'field': 'timestamp',
              'interval': interval,
              'min_doc_count': 1
            },
            'aggs': {
              'anomalyScore': {
                'max': {
                  'field': 'anomaly_score'
                }
              }
            }
          }
        }
      }
    })
    .then(function (resp) {
      // console.log('Time series search service getScoresByBucket() resp:', resp);

      const aggregationsByTime = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      _.each(aggregationsByTime, function (dataForTime) {
        const time = dataForTime.key;
        obj.results[time] = {
          'anomalyScore': _.get(dataForTime, ['anomalyScore', 'value']),
        };
      });

      deferred.resolve(obj);
    })
    .catch(function (resp) {
      deferred.reject(resp);
    });
    return deferred.promise;
  };



  this.getModelDebugOutput = function (index, jobIds, earliestMs, latestMs, interval, aggType) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      results: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        'timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });

    let indexString = '';

    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, function (jobId, i) {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
          indexString += ',';
        }
        jobIdFilterStr += 'job_id:';
        jobIdFilterStr += jobId;

        indexString += '.ml-anomalies-' + jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard': true,
          'query': jobIdFilterStr
        }
      });
    }

    es.search({
      index: indexString,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [{
              'query_string': {
                'query': '_type:result AND result_type:model_debug_output',
                'analyze_wildcard': true
              }
            }, {
              'bool': {
                'must': boolCriteria
              }
            }]
          }
        },
        'aggs': {
          'times': {
            'date_histogram': {
              'field': 'timestamp',
              'interval': interval,
              'min_doc_count': 1
            },
            'aggs': {
              'actual': {
                'avg': {
                  'field': 'actual'
                }
              },
              'debugUpper': {
                // 'max': {
                [aggType.max]: {
                  'field': 'debug_upper'
                }
              },
              'debugLower': {
                // 'min': {
                [aggType.min]: {
                  'field': 'debug_lower'
                }
              }
            }
          }
        }
      }
    })
    .then(function (resp) {
      // console.log('Time series search service getModelDebugOutput() resp:', resp);

      const aggregationsByTime = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      _.each(aggregationsByTime, function (dataForTime) {
        const time = dataForTime.key;
        let debugUpper = _.get(dataForTime, ['debugUpper', 'value']);
        let debugLower = _.get(dataForTime, ['debugLower', 'value']);

        if (debugUpper !== undefined) {
          debugUpper = debugUpper.toFixed(4);
        } else {
          debugUpper = 0;
        }
        if (debugLower !== undefined) {
          debugLower = debugLower.toFixed(4);
        } else {
          debugLower = 0;
        }

        obj.results[time] = {
          actual: _.get(dataForTime, ['actual', 'value']),
          debugUpper: debugUpper,
          debugLower: debugLower
        };
      });

      deferred.resolve(obj);
    })
    .catch(function (resp) {
      deferred.reject(resp);
    });

    return deferred.promise;
  };


});
