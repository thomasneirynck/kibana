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

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlSwimlaneSearchService', function ($q, $timeout, es, timefilter) {

  this.getScoresByBucket = function (index, jobIds, earliestMs, latestMs, interval, maxResults) {
    // TODO - move into results_service.js.
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
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });

    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard': true,
          'query': jobIdFilterStr
        }
      });
    }

    // TODO - remove hardcoded aggregation interval.
    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [{
              'query_string': {
                'query': '_type:bucket',
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
          'jobId': {
            'terms': {
              'field': 'jobId',
              'size': maxResults !== undefined ? maxResults : 5,
              'order': {
                'anomalyScore': 'desc'
              }
            },
            'aggs': {
              'anomalyScore': {
                'max': {
                  'field': 'anomalyScore'
                }
              },
              'byTime': {
                'date_histogram': {
                  'field': '@timestamp',
                  'interval': interval,
                  'min_doc_count': 1,
                  'extended_bounds': {
                    'min': earliestMs,
                    'max': latestMs
                  }
                },
                'aggs': {
                  'anomalyScore': {
                    'max': {
                      'field': 'anomalyScore'
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
      console.log('Circle swimlane getScoresByBucket() resp:', resp);

      const dataByJobId = _.get(resp, ['aggregations', 'jobId', 'buckets'], []);
      _.each(dataByJobId, (dataForJob) => {
        const jobId = dataForJob.key;

        const resultsForTime = {};

        const dataByTime = _.get(dataForJob, ['byTime', 'buckets'], []);
        _.each(dataByTime, (dataForTime) => {
          const value = _.get(dataForTime, ['anomalyScore', 'value']);
          if (value !== undefined) {
            const time = dataForTime.key;
            resultsForTime[time] = _.get(dataForTime, ['anomalyScore', 'value']);
          }
        });
        obj.results[jobId] = resultsForTime;
      });

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // Obtains the record level normalizedProbability values by detector ID
  // for a particular job ID(s).
  // Pass an empty array or ['*'] to search over all job IDs.
  // Returned response contains a results property, which contains a
  // three level aggregation of values by job Id, detector index, and time (epoch ms).
  this.getScoresByDetector = function (index, jobIds, earliestMs, latestMs, interval, maxResults) {
    // TODO - move into results_service.js.
    const deferred = $q.defer();
    const obj = {success: true, results: {}};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });
    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    // TODO - remove hardcoded aggregation interval.
    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:record',
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'aggs': {
          'jobId': {
            'terms': {
              'field': 'jobId',
              'size': maxResults !== undefined ? maxResults : 5,
              'order': {
                'normalizedProbability': 'desc'
              }
            },
            'aggs': {
              'normalizedProbability': {
                'max': {
                  'field': 'normalizedProbability'
                }
              },
              'detectorIndex': {
                'terms': {
                  'field': 'detectorIndex',
                  'size': maxResults !== undefined ? maxResults : 5,
                  'order': {
                    'normalizedProbability': 'desc'
                  }
                },
                'aggs': {
                  'normalizedProbability': {
                    'max': {
                      'field': 'normalizedProbability'
                    }
                  },
                  'byTime': {
                    'date_histogram': {
                      'field': '@timestamp',
                      'interval': interval,
                      'min_doc_count': 1,
                      'extended_bounds': {
                        'min': earliestMs,
                        'max': latestMs
                      }
                    },
                    'aggs': {
                      'normalizedProbability': {
                        'max': {
                          'field': 'normalizedProbability'
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
      console.log('Detector swimlane getScoresByDetector() resp:', resp);
      // Process the three levels for aggregation for jobId, detectorId, time.
      const dataByJobId = _.get(resp, ['aggregations', 'jobId', 'buckets'], []);
      _.each(dataByJobId, (dataForJob) => {
        const resultsForJob = {};
        const jobId = dataForJob.key;

        const dataByDetectorId = _.get(dataForJob, ['detectorIndex', 'buckets'], []);
        _.each(dataByDetectorId, (dataForDetector) => {
          const resultsForDetectorId = {};
          const detectorId = dataForDetector.key;

          const dataByTime = _.get(dataForDetector, ['byTime', 'buckets'], []);
          _.each(dataByTime, (dataForTime) => {
            const value = _.get(dataForTime, ['normalizedProbability', 'value']);
            if (value !== undefined) {
              resultsForDetectorId[dataForTime.key] = value;
            }
          });
          resultsForJob[detectorId] = resultsForDetectorId;
        });

        obj.results[jobId] = resultsForJob;

      });

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };


  // Obtains the record level normalizedProbability values by detector ID
  // for a particular job ID(s).
  // Pass an empty array or ['*'] to search over all job IDs.
  // Returned response contains a results property, which contains a
  // three level aggregation of values by job Id, detector index, and time (epoch ms).
  this.getScoresByInfluencerType = function (index, jobIds, earliestMs, latestMs, interval, maxResults) {
    // TODO - move into results_service.js.
    const deferred = $q.defer();
    const obj = {success: true, results: {}};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });
    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    // TODO - remove hardcoded aggregation interval.
    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:bucketInfluencer',
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'aggs': {
          'influencerFieldName': {
            'terms': {
              'field': 'influencerFieldName',
              'size': maxResults !== undefined ? maxResults : 10,
              'order': {
                'anomalyScore': 'desc'
              }
            },
            'aggs': {
              'anomalyScore': {
                'max': {
                  'field': 'anomalyScore'
                }
              },
              'byTime': {
                'date_histogram': {
                  'field': '@timestamp',
                  'interval': interval,
                  'min_doc_count': 1,
                  'extended_bounds': {
                    'min': earliestMs,
                    'max': latestMs
                  }
                },
                'aggs': {
                  'anomalyScore': {
                    'max': {
                      'field': 'anomalyScore'
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
      console.log('Detector swimlane getScoresByInfluencer() resp:', resp);
      obj.results.influencerTypes = {};

      const influencerTypeResults = {};

      const dataByInfluencerTypeValue = _.get(resp, ['aggregations', 'influencerFieldName', 'buckets'], []);
      _.each(dataByInfluencerTypeValue, (dataForInfluencer) => {
        const resultsForInfluencer = {};
        const influencerFieldType = dataForInfluencer.key;

        const dataByTime = _.get(dataForInfluencer, ['byTime', 'buckets'], []);
        _.each(dataByTime, (dataForTime) => {
          const value = _.get(dataForTime, ['anomalyScore', 'value']);
          if (value !== undefined) {
            resultsForInfluencer[dataForTime.key] = value;
          }
        });

        influencerTypeResults[influencerFieldType] = resultsForInfluencer;
      });

      obj.results.influencerTypes = influencerTypeResults;

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getScoresByInfluencerValue = function (index, jobIds, earliestMs, latestMs, interval, maxResults) {
    // TODO - move into results_service.js.
    const deferred = $q.defer();
    const obj = {success: true, results: {}};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });
    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    // TODO - remove hardcoded aggregation interval.
    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:influencer',
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'aggs': {
          'influencerFieldValue': {
            'terms': {
              'field': 'influencerFieldValue',
              'size': maxResults !== undefined ? maxResults : 10,
              'order': {
                'anomalyScore': 'desc'
              }
            },
            'aggs': {
              'anomalyScore': {
                'max': {
                  'field': 'anomalyScore'
                }
              },
              'byTime': {
                'date_histogram': {
                  'field': '@timestamp',
                  'interval': interval,
                  'min_doc_count': 1,
                  'extended_bounds': {
                    'min': earliestMs,
                    'max': latestMs
                  }
                },
                'aggs': {
                  'anomalyScore': {
                    'max': {
                      'field': 'anomalyScore'
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
      console.log('Detector swimlane getScoresByInfluencer() resp:', resp);
      obj.results.influencerValues = {};

      const influencerValueResults = {};

      // Process the two levels for aggregation for influencerFieldValue and time.
      const dataByInfluencerFieldValue = _.get(resp, ['aggregations', 'influencerFieldValue', 'buckets'], []);
      _.each(dataByInfluencerFieldValue, (dataForInfluencer) => {
        const resultsForInfluencer = {};
        const influencerFieldValue = dataForInfluencer.key;

        const dataByTime = _.get(dataForInfluencer, ['byTime', 'buckets'], []);
        _.each(dataByTime, (dataForTime) => {
          const value = _.get(dataForTime, ['anomalyScore', 'value']);
          if (value !== undefined) {
            resultsForInfluencer[dataForTime.key] = value;
          }
        });

        influencerValueResults[influencerFieldValue] = resultsForInfluencer;
      });

      obj.results.influencerValues = influencerValueResults;

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

      // Queries Elasticsearch to obtain the record level results for
  // the specified job(s) and time range.
  // Pass an empty array or ['*'] to search over all job IDs.
  this.getRecords = function (index, jobIds, earliestMs, latestMs, maxResults) {
    const deferred = $q.defer();
    const obj = {success: true, records: []};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range, normalized probability,  plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });

    boolCriteria.push({
      'range': {
        'normalizedProbability': {
          'gte': 0//($scope.vis.params.threshold || 0),
        }
      }
    });

    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    es.search({
      index: index,
      size: maxResults !== undefined ? maxResults : 100,
      body: {
        '_source': ['jobId',
        '@timestamp',
        'detectorIndex',
        'influencers',
        'normalizedProbability',
        'actual',
        'typical',
        'byFieldName',
        'byFieldValue',
        'function',
        'functionDescription',
        'probability',
        'partitionFieldValue',
        'partitionFieldName',
        'singleCauseByFieldName',
        'singleCauseByFieldValue',
        'overFieldName',
        'overFieldValue',
        'isInterim',
        'entityName',
        'entityValue',
        'correlatedByFieldValue'],
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:record',
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'sort' : [
          { 'normalizedProbability' : {'order' : 'desc'}}
        ],
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        _.each(resp.hits.hits, (hit) => {
          obj.records.push(hit._source);
        });
      }
      // console.log('records!!!!!', obj)
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getTopInfluencers = function (index, laneLabel, jobIds, swimlaneType, earliestMs, latestMs, maxResults, type) {
    const deferred = $q.defer();
    const obj = {success: true, results: []};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range, normalized probability,  plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': (earliestMs * 1000),
          'lte': (latestMs * 1000),
          'format': 'epoch_millis'
        }
      }
    });

    // boolCriteria.push({
    //   'range': {
    //     'maxAnomalyScore': {
    //       'gte': 0
    //     }
    //   }
    // });

    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    const resutsSize = 20;
    let query = '_type:influencer';
    if (type[swimlaneType] === type.INF_TYPE) {
      query +=  'AND influencerFieldName:' + laneLabel;
    }

    es.search({
      index: index,
      size: maxResults !== undefined ? maxResults : 100,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': query,
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'aggs': {
          'maxInfluencerFieldValues': {
            'terms': {
              'field': 'influencerFieldValue',
              'size': resutsSize,
              'order': {
                'maxAnomalyScore': 'desc'
              }
            },
            'aggs': {
              'maxAnomalyScore': {
                'max': {
                  'field': 'anomalyScore'
                }
              },
              'sumAnomalyScore': {
                'sum': {
                  'field': 'anomalyScore'
                }
              }
            }
          },
          'sumInfluencerFieldValues': {
            'terms': {
              'field': 'influencerFieldValue',
              'size': resutsSize,
              'order': {
                'sumAnomalyScore': 'desc'
              }
            },
            'aggs': {
              'sumAnomalyScore': {
                'sum': {
                  'field': 'anomalyScore'
                }
              },
              'maxAnomalyScore': {
                'max': {
                  'field': 'anomalyScore'
                }
              }
            }
          }
        }
      }
    })
    .then((resp) => {
      // console.log('Detector swimlane searchTopInfluencers() resp:', resp);
      const results = {
        topMax: [],
        topSum: []
      };

      // Process the two levels for aggregation for influencerFieldValue and time.
      let buckets = _.get(resp, ['aggregations', 'maxInfluencerFieldValues', 'buckets'], []);
      _.each(buckets, (dataForInfluencer) => {
        const key = dataForInfluencer.key;
        const max = +_.get(dataForInfluencer, ['maxAnomalyScore', 'value'], 0);
        const sum = +_.get(dataForInfluencer, ['sumAnomalyScore', 'value'], 0);
        results.topMax.push({
          id: key,
          max: Math.floor(max),
          sum: Math.floor(sum),
          severity: anomalyUtils.getSeverity(max)
        });
      });

      buckets = _.get(resp, ['aggregations', 'sumInfluencerFieldValues', 'buckets'], []);
      _.each(buckets, (dataForInfluencer) => {
        const key = dataForInfluencer.key;
        const max = +_.get(dataForInfluencer, ['maxAnomalyScore', 'value'], 0);
        const sum = +_.get(dataForInfluencer, ['sumAnomalyScore', 'value'], 0);
        results.topSum.push({
          id: key,
          max: Math.floor(max),
          sum: Math.floor(sum),
          severity: anomalyUtils.getSeverity(max)
        });
      });

      obj.results = results;
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getEventRate = function (index, jobIds, earliestMs, latestMs, interval, maxResults) {
    // TODO - move into results_service.js.
    const deferred = $q.defer();
    const obj = {success: true, results: {}};

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range plus any specified job IDs.
    const boolCriteria = [];
    boolCriteria.push({
      'range': {
        '@timestamp': {
          'gte': earliestMs,
          'lte': latestMs,
          'format': 'epoch_millis'
        }
      }
    });
    if (jobIds && jobIds.length > 0 && !(jobIds.length === 1 && jobIds[0] === '*')) {
      let jobIdFilterStr = '';
      _.each(jobIds, (jobId, i) => {
        if (i > 0) {
          jobIdFilterStr += ' OR ';
        }
        jobIdFilterStr += 'jobId:';
        jobIdFilterStr += jobId;
      });
      boolCriteria.push({
        'query_string': {
          'analyze_wildcard':true,
          'query':jobIdFilterStr
        }
      });
    }

    // TODO - remove hardcoded aggregation interval.
    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': [
              {
                'query_string': {
                  'query': '_type:bucket',
                  'analyze_wildcard': true
                }
              },
              {
                'bool': {
                  'must': boolCriteria
                }
              }
            ]
          }
        },
        'aggs': {
          'times': {
            'date_histogram': {
              'field': '@timestamp',
              // 'interval': '2820s',
              'interval': interval,
              'min_doc_count': 1,
              'extended_bounds': {
                'min': earliestMs,
                'max': latestMs
              }
            },
            'aggs': {
              'jobs': {
                'terms': {
                  'field': 'jobId',
                  'size': maxResults !== undefined ? maxResults : 10,
                  'order': {
                    'sumEventCount': 'desc'
                  }
                },
                'aggs': {
                  'sumEventCount': {
                    'sum': {
                      'field': 'eventCount'
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
      console.log('Circle swimlane getEventRate() resp:', resp);

      // Process the two levels for aggregation for influencerFieldValue and time.
      const dataByTimeBucket = _.get(resp, ['aggregations', 'times', 'buckets'], []);
      _.each(dataByTimeBucket, (dataForTime) => {
        let time = dataForTime.key;
        time = time / 1000;

        const jobs = _.get(dataForTime, ['jobs', 'buckets'], []);
        _.each(jobs, (dataForJob) => {
          const jobId = dataForJob.key;
          let jobResults = obj.results[jobId];
          if (jobResults === undefined) {
            jobResults = obj.results[jobId] = {};
          }
          jobResults[time] = _.get(dataForJob, ['sumEventCount', 'value'], []);
        });
      });
      console.log('Circle swimlane getEventRate() obj.results:', obj.results);
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };


  this.calculateBounds = function (dataset, bucketIntervalSeconds, boundsIn) {
    // Extract the bounds of the time filter so we can set the x-axis min and max.
    const bounds = (boundsIn !== undefined) ? boundsIn : timefilter.getActiveBounds();
    if (bounds) {
      // TODO - get aggregation determine the aggregation interval out of the visualization.
      // For now using a fixed interval of 3h.
      const aggInterval = moment.duration(bucketIntervalSeconds, 'seconds');

      // Elasticsearch aggregation returns points at start of bucket,
      // so set the x-axis min/max to the start/end of the aggregation interval.
      const earliest = Math.floor(bounds.min.valueOf() / aggInterval.asMilliseconds()) * (aggInterval.asMilliseconds());
      const latest = Math.ceil(bounds.max.valueOf() / aggInterval.asMilliseconds()) * (aggInterval.asMilliseconds());

      dataset.earliest = earliest / 1000;
      dataset.interval = aggInterval.asSeconds();
      dataset.latest = latest / 1000;
    }
  };

});
