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

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlFieldDataSearchService', function ($q, es) {

  this.getFieldStats = function (index, field, fieldType, timeFieldName, earliestMs, latestMs) {
    switch (fieldType) {
      case 'number':
        return this.getNumericFieldStats(index, field, timeFieldName, earliestMs, latestMs);
      case 'keyword':
      case 'ip':
        return this.getStringFieldStats(index, field, timeFieldName, earliestMs, latestMs);
      case 'date':
        return this.getDateFieldStats(index, field, timeFieldName, earliestMs, latestMs);
      default:
        return $q.defer().promise();
    }

  };

  this.getNumericFieldStats = function (index, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    // Add criteria for the time range plus any additional supplied query.
    const filterCriteria = [];

    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    filterCriteria.push(timeRangeCriteria);

    const aggs = {
      'cardinality': {
        'cardinality': { 'field':field }
      },
      'field_stats': {
        'stats': { 'field':field }
      },
      'top': {
        'terms': {
          'field': field,
          'size': 10,
          'order': {
            '_count': 'desc'
          }
        }
      },
      'median': {
        'percentiles': {
          'field': field,
          'percents': [50],
          'keyed': false
        }
      }
    };

    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': filterCriteria
          }
        },
        'aggs' : aggs
      }
    })
    .then((resp) => {
      const aggregations = resp.aggregations;
      obj.stats.totalCount = _.get(resp, ['hits', 'total'], 0);
      obj.stats.cardinality = _.get(aggregations, ['cardinality', 'value'], 0);
      obj.stats.count = _.get(aggregations, ['field_stats', 'count'], 0);
      obj.stats.min = _.get(aggregations, ['field_stats', 'min'], 0);
      obj.stats.max = _.get(aggregations, ['field_stats', 'max'], 0);
      obj.stats.avg = _.get(aggregations, ['field_stats', 'avg'], 0);
      obj.stats.median = _.get(aggregations, ['median', 'values'], [{ value:0 }])[0].value;
      obj.stats.topValues = _.get(aggregations, ['top', 'buckets'],[]);

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.getStringFieldStats = function (index, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    // Add criteria for the time range plus any additional supplied query.
    const filterCriteria = [];

    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    filterCriteria.push(timeRangeCriteria);

    const aggs = {
      'value_count': {
        'value_count': { 'field':field }
      },
      'cardinality': {
        'cardinality': { 'field':field }
      },
      'top': {
        'terms': {
          'field': field,
          'size': 10,
          'order': {
            '_count': 'desc'
          }
        }
      }
    };

    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': filterCriteria
          }
        },
        'aggs' : aggs
      }
    })
    .then((resp) => {
      const aggregations = resp.aggregations;
      obj.stats.totalCount = _.get(resp, ['hits', 'total'], 0);
      obj.stats.count = _.get(aggregations, ['value_count', 'value'], 0);
      obj.stats.cardinality = _.get(aggregations, ['cardinality', 'value'], 0);
      obj.stats.topValues = _.get(aggregations, ['top', 'buckets'],[]);

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.getDateFieldStats = function (index, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    // Add criteria for the time range plus any additional supplied query.
    const filterCriteria = [];

    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    filterCriteria.push(timeRangeCriteria);

    const aggs = {
      'field_stats': {
        'stats': { 'field':field }
      }
    };

    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': filterCriteria
          }
        },
        'aggs' : aggs
      }
    })
    .then((resp) => {
      const aggregations = resp.aggregations;
      obj.stats.totalCount = _.get(resp, ['hits', 'total'], 0);
      obj.stats.count = _.get(aggregations, ['field_stats', 'count'], 0);

      const min = _.get(aggregations, ['field_stats', 'min']);
      const max = _.get(aggregations, ['field_stats', 'max']);

      obj.stats.earliest = (min !== undefined ? new Date(min) : null);
      obj.stats.latest = (max !== undefined ? new Date(max) : null);

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.getMetricDistributionData = function (index, metricFieldName, percentileSpacing,
    timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = { success: true, results: [] };

    // Build the precents parameter which defines the percentiles to calculate.
    // Round to nearest integer, for a maximum of 100 percentiles.

    // TODO - add in percentiles from 95 to 100 in case they are suitable for display.
    const percents = [];
    let percentToAdd = percentileSpacing;
    const maxPercent = 95;

    while (percentToAdd <= maxPercent) {
      percents.push(percentToAdd);
      percentToAdd = percentToAdd + percentileSpacing;
    }

    // Build the criteria to use in the bool filter part of the request.
    // Adds criteria for the time range.
    const filterCriteria = [];

    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    filterCriteria.push(timeRangeCriteria);
    filterCriteria.push({
      'exists' : { 'field' : metricFieldName }
    });

    es.search({
      index: index,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': filterCriteria
          }
        },
        'aggs': {
          'min': {
            'min': {
              'field': metricFieldName
            }
          },
          'percentiles': {
            'percentiles': {
              'field': metricFieldName,
              'percents': percents,
              'keyed': false
            }
          }
        }
      }
    })
    .then((resp) => {
      console.log('getMetricDistributionData resp:', resp);
      if (resp.hits.total > 0) {
        let lowerBound = _.get(resp, ['aggregations', 'min', 'value'], 0);
        let percentileBuckets = _.get(resp, ['aggregations', 'percentiles', 'values'], []);
        if (lowerBound >= 0) {
          // Process 0 - 90% percentiles.
          percentileBuckets = _.filter(percentileBuckets, (bucket) => {
            return bucket.key <= 90;
          });
        } else {
          // Process 5 - 95% percentiles.
          lowerBound = percentileBuckets[0].value;
          percentileBuckets = _.filter(percentileBuckets, (bucket) => {
            return (bucket.key >= 10 && bucket.key <= 95);
          });
        }

        // Combine buckets with the same value.
        // Note that results from percentiles aggregation can have precision rounding
        // artifacts e.g returning 200 and 200.000000000123, so equalize scores
        // when a later bucket has a lower value.
        const totalBuckets = percentileBuckets.length;
        let lastBucketValue = lowerBound;
        let numEqualValueBuckets = 0;
        // for (let i = 0; i < (totalBuckets - 1); i++) {
        //   // TODO - look ahead more buckets in case there are more than one
        //   // buckets with a fractionally lower value.
        //   percentileBuckets[i].value = Math.min(percentileBuckets[i].value, percentileBuckets[i + 1].value);
        // }

        for (let i = 0; i < totalBuckets; i++) {
          const bucket = percentileBuckets[i];

          //if (bucket.value > lastBucketValue) {
          if (bucket.value.toPrecision(15) !== lastBucketValue.toPrecision(15)) {
            // Create a bucket for any 'equal value' buckets which had a value <= last bucket
            if (numEqualValueBuckets > 0) {
              obj.results.push({
                percent: numEqualValueBuckets * percentileSpacing,
                minValue: lastBucketValue,
                maxValue: lastBucketValue
              });
            }

            obj.results.push({
              percent: percentileSpacing,
              minValue: lastBucketValue,
              maxValue: bucket.value
            });

            lastBucketValue = bucket.value;
            numEqualValueBuckets = 0;
          } else {
            numEqualValueBuckets++;
            if (i === (totalBuckets - 1)) {
              // If at the last bucket, create a final bucket for the equal value buckets.
              obj.results.push({
                percent: numEqualValueBuckets * percentileSpacing,
                minValue: lastBucketValue,
                maxValue: lastBucketValue
              });
            }
          }
        }

        console.log('getMetricDistributionData resuls:', obj.results);
      }

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getFieldExamples = function (index, field, maxNumberExamples, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = { success: true, examples: [] };

    const filterCriteria = [];
    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    filterCriteria.push(timeRangeCriteria);

    filterCriteria.push({
      'exists' : { 'field' : field }
    });

    es.search({
      index: index,
      size: 100,
      body: {
        '_source': field,
        'query': {
          'bool': {
            'filter': filterCriteria
          }
        }
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        const hits = resp.hits.hits;
        for (let i = 0; i < hits.length; i++) {
          const example = hits[i]._source[field];
          if (obj.examples.indexOf(example) === -1) {
            obj.examples.push(example);
            if (obj.examples.length === maxNumberExamples) {
              break;
            }
          }
        }
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

});
