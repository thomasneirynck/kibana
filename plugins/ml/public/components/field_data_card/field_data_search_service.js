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

import { DATA_VISUALIZER_FIELD_TYPES } from 'plugins/ml/constants/field_types';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlFieldDataSearchService', function ($q, es) {

  this.getAggregatableFieldStats = function (index, query, field, fieldType,
    timeFieldName, earliestMs, latestMs) {
    switch (fieldType) {
      case DATA_VISUALIZER_FIELD_TYPES.NUMBER:
        return this.getNumericFieldStats(index, query, field, timeFieldName, earliestMs, latestMs);
      case DATA_VISUALIZER_FIELD_TYPES.DATE:
        return this.getDateFieldStats(index, query, field, timeFieldName, earliestMs, latestMs);
      case DATA_VISUALIZER_FIELD_TYPES.BOOLEAN:
        return this.getBooleanFieldStats(index, query, field, timeFieldName, earliestMs, latestMs);
      case DATA_VISUALIZER_FIELD_TYPES.KEYWORD:
      case DATA_VISUALIZER_FIELD_TYPES.IP:
        return this.getStringFieldStats(index, query, field, timeFieldName, earliestMs, latestMs);
      default:
        return this.getDefaultAggregatableFieldStats(index, query, field, timeFieldName, earliestMs, latestMs);
    }
  };

  this.getNumericFieldStats = function (index, query, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

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

  this.getStringFieldStats = function (index, query, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

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

  this.getDateFieldStats = function (index, query, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {}
    };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

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

  this.getBooleanFieldStats = function (index, query, field, timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: { 'trueCount': 0, 'falseCount': 0 }
    };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    const aggs = {
      'value_count': {
        'value_count': { 'field':field }
      },
      'values': {
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
      const valueBuckets = _.get(aggregations, ['values', 'buckets'],[]);
      _.each(valueBuckets, (bucket) => {
        obj.stats[`${bucket.key_as_string}Count`] = bucket.doc_count;
      });

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.getDefaultAggregatableFieldStats = function (index, query, field, timeFieldName, earliestMs, latestMs) {
    // Obtains the 'default' stats for an aggregatable field which is not
    // one of the types covered in specific functions.
    const deferred = $q.defer();
    const obj = {
      success: true,
      stats: {},
      examples: []
    };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Use an exists filter to return examples of the field.
    filterCriteria.push({
      'exists' : { 'field' : field }
    });

    const aggs = {
      'value_count': {
        'value_count': { 'field':field }
      },
      'cardinality': {
        'cardinality': { 'field':field }
      }
    };

    // Request 50 docs so that we can return up to 5 examples of the field
    // as well as some basic statistics.
    es.search({
      index: index,
      size: 50,
      body: {
        '_source': field,
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

      if (resp.hits.total !== 0) {
        const hits = resp.hits.hits;
        for (let i = 0; i < hits.length; i++) {
          // Look in the _source for the field value.
          // If the field is not in the _source (as will happen if the
          // field is populated using copy_to in the index mapping),
          // there will be no example to add.
          const example = _.get(hits[i]._source, field);
          if (example !== undefined && obj.examples.indexOf(example) === -1) {
            obj.examples.push(example);
            if (obj.examples.length === 10) {
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

  this.getMetricDistributionData = function (index, query, metricFieldName,
    timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = { success: true, results: { percentiles: [], minPercentile: 0, maxPercentile: 100 } };

    // Build the percents parameter which defines the percentiles to calculate.
    // Use a fixed percentile spacing of 5%.
    const maxPercent = 100;
    const percentileSpacing = 5;
    const percents = [];
    let percentToAdd = percentileSpacing;

    while (percentToAdd <= maxPercent) {
      percents.push(percentToAdd);
      percentToAdd = percentToAdd + percentileSpacing;
    }

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);
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
      if (resp.hits.total > 0) {
        let lowerBound = _.get(resp, ['aggregations', 'min', 'value'], 0);
        const allPercentiles = _.get(resp, ['aggregations', 'percentiles', 'values'], []);
        let percentileBuckets = [];
        if (lowerBound >= 0) {
          // By default return results for 0 - 90% percentiles.
          obj.results.minPercentile = 0;
          obj.results.maxPercentile = 90;
          percentileBuckets = allPercentiles.slice(0, allPercentiles.length - 2);

          // Look ahead to the last percentiles and process these too if
          // they don't add more than 50% to the value range.
          const lastValue = _.last(percentileBuckets).value;
          const upperBound = lowerBound + (1.5 * (lastValue - lowerBound));
          const filteredLength = percentileBuckets.length;
          for (let i = filteredLength; i < allPercentiles.length; i++) {
            if (allPercentiles[i].value < upperBound) {
              percentileBuckets.push(allPercentiles[i]);
              obj.results.maxPercentile += percentileSpacing;
            } else {
              break;
            }
          }

        } else {
          // By default return results for 5 - 95% percentiles.
          const dataMin = lowerBound;
          lowerBound = allPercentiles[0].value;
          obj.results.minPercentile = 5;
          obj.results.maxPercentile = 95;
          percentileBuckets = allPercentiles.slice(1, allPercentiles.length - 1);

          // Add in 0-5 and 95-100% if they don't add more
          // than 25% to the value range at either end.
          const lastValue = _.last(percentileBuckets).value;
          const maxDiff = 0.25 * (lastValue - lowerBound);
          if (lowerBound - dataMin < maxDiff) {
            percentileBuckets.splice(0, 0, allPercentiles[0]);
            obj.results.minPercentile = 0;
            lowerBound = dataMin;
          }

          if (allPercentiles[allPercentiles.length - 1].value - lastValue < maxDiff) {
            percentileBuckets.push(allPercentiles[allPercentiles.length - 1]);
            obj.results.maxPercentile = 100;
          }
        }

        // Combine buckets with the same value.
        const totalBuckets = percentileBuckets.length;
        let lastBucketValue = lowerBound;
        let numEqualValueBuckets = 0;
        for (let i = 0; i < totalBuckets; i++) {
          const bucket = percentileBuckets[i];

          // Results from the percentiles aggregation can have precision rounding
          // artifacts e.g returning 200 and 200.000000000123, so check for equality
          // around double floating point precision i.e. 15 sig figs.
          if (bucket.value.toPrecision(15) !== lastBucketValue.toPrecision(15)) {
            // Create a bucket for any 'equal value' buckets which had a value <= last bucket
            if (numEqualValueBuckets > 0) {
              obj.results.percentiles.push({
                percent: numEqualValueBuckets * percentileSpacing,
                minValue: lastBucketValue,
                maxValue: lastBucketValue
              });
            }

            obj.results.percentiles.push({
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
              obj.results.percentiles.push({
                percent: numEqualValueBuckets * percentileSpacing,
                minValue: lastBucketValue,
                maxValue: lastBucketValue
              });
            }
          }
        }

        console.log('getMetricDistributionData results:', obj.results);
      }

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getFieldExamples = function (index, query, field, maxNumberExamples,
    timeFieldName, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = { success: true, examples: [] };

    // Build the criteria to use in the bool filter part of the request.
    const filterCriteria = buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Use an exists filter to return examples of the field.
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
          // Look in the _source for the field value.
          // If the field is not in the _source (as will happen if the
          // field is populated using copy_to in the index mapping),
          // there will be no example to add.
          // Use lodash _.get() to support field names containing dots.
          const example = _.get(hits[i]._source, field);
          if (example !== undefined && obj.examples.indexOf(example) === -1) {
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

  // Builds the base filter criteria used in queries,
  // adding criteria for the time range and an optional query.
  function buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query) {
    const filterCriteria = [{
      range: {
        [timeFieldName]: {
          gte: earliestMs,
          lte: latestMs,
          format: 'epoch_millis'
        }
      }
    }];

    if (query) {
      filterCriteria.push(query);
    }

    return filterCriteria;
  }

});
