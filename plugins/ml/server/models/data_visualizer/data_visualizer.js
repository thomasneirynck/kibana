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
import { ML_JOB_FIELD_TYPES } from '../../../common/constants/field_types';

const SAMPLER_TOP_TERMS_THRESHOLD = 100000;
const SAMPLER_TOP_TERMS_SHARD_SIZE = 5000;

export class DataVisualizer {

  constructor(callWithRequest) {
    this.callWithRequest = callWithRequest;
  }

  // Obtains overall stats on the fields in the supplied index pattern, returning an object
  // containing the total document count, and four arrays showing which of the supplied
  // aggregatable and non-aggregatable fields do or do not exist in documents.
  // Sampling will be used if supplied samplerShardSize > 0.
  async getOverallStats(
    indexPatternTitle,
    query,
    aggregatableFields,
    nonAggregatableFields,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    let stats =  {
      nonAggregatableExistsFields: [],
      nonAggregatableNotExistsFields: []
    };

    const aggregatableFieldStats = await this.checkAggregatableFieldsExist(
      indexPatternTitle,
      query,
      aggregatableFields,
      samplerShardSize,
      timeFieldName,
      earliestMs,
      latestMs);
    stats = _.extend(stats, aggregatableFieldStats);

    await Promise.all(nonAggregatableFields.map(async (field) => {
      const existsInDocs = await this.checkNonAggregatableFieldExists(
        indexPatternTitle,
        query,
        field,
        timeFieldName,
        earliestMs,
        latestMs);

      const fieldData = {
        fieldName: field,
        existsInDocs,
        stats: {}
      };

      if (existsInDocs === true) {
        stats.nonAggregatableExistsFields.push(fieldData);
      } else {
        stats.nonAggregatableNotExistsFields.push(fieldData);
      }
    }));

    return stats;
  }

  // Obtains statistics for supplied list of fields. The statistics for each field in the
  // returned array depend on the type of the field (keyword, number, date etc).
  // Sampling will be used if supplied samplerShardSize > 0.
  async getStatsForFields(
    indexPatternTitle,
    query,
    fields,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs,
    interval,
    maxExamples) {
    const results = [];

    await Promise.all(fields.map(async (field) => {
      let stats = { fieldName: field.fieldName };
      switch(field.type) {
        case ML_JOB_FIELD_TYPES.NUMBER:
          // undefined fieldName is used for a document count request.
          if (field.fieldName !== undefined) {
            stats = await this.getNumericFieldStats(
              indexPatternTitle,
              query,
              field.fieldName,
              _.get(field, 'cardinality', 0),
              samplerShardSize,
              timeFieldName,
              earliestMs,
              latestMs);
          } else {
            stats = await this.getDocumentCountStats(
              indexPatternTitle,
              query,
              timeFieldName,
              earliestMs,
              latestMs,
              interval);
          }
          break;
        case ML_JOB_FIELD_TYPES.KEYWORD:
        case ML_JOB_FIELD_TYPES.IP:
          stats = await this.getStringFieldStats(
            indexPatternTitle,
            query,
            field.fieldName,
            _.get(field, 'cardinality', 0),
            samplerShardSize,
            timeFieldName,
            earliestMs,
            latestMs);
          break;
        case ML_JOB_FIELD_TYPES.DATE:
          stats = await this.getDateFieldStats(
            indexPatternTitle,
            query,
            field.fieldName,
            samplerShardSize,
            timeFieldName,
            earliestMs,
            latestMs);
          break;
        case ML_JOB_FIELD_TYPES.BOOLEAN:
          stats = await this.getBooleanFieldStats(
            indexPatternTitle,
            query,
            field.fieldName,
            samplerShardSize,
            timeFieldName,
            earliestMs,
            latestMs);
          break;
        case ML_JOB_FIELD_TYPES.TEXT:
          stats = await this.getFieldExamples(
            indexPatternTitle,
            query,
            field.fieldName,
            timeFieldName,
            earliestMs,
            latestMs,
            maxExamples);
          break;
        default:
          stats = await this.getDefaultAggregatableFieldStats(
            indexPatternTitle,
            query,
            field.fieldName,
            timeFieldName,
            earliestMs,
            latestMs,
            maxExamples);
          break;
      }

      results.push(stats);

    }));

    return results;
  }

  async checkAggregatableFieldsExist(
    indexPatternTitle,
    query,
    aggregatableFields,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Value count aggregation faster way of checking if field exists than using
    // filter aggregation with exists query.
    const aggs = {};
    aggregatableFields.forEach((field) => {
      aggs[`${field}_count`] = {
        value_count: { field }
      };
      aggs[`${field}_cardinality`] = {
        cardinality: { field }
      };
    });

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: this.buildSamplerAggregation(aggs, samplerShardSize)
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const aggregations = resp.aggregations;
    const totalCount = _.get(resp, ['hits', 'total'], 0);
    const stats =  {
      totalCount,
      aggregatableExistsFields: [],
      aggregatableNotExistsFields: []
    };

    const aggsPath = this.getResponseAggregationsPath(samplerShardSize);
    const sampleCount = samplerShardSize > 0 ? _.get(aggregations, ['sample', 'doc_count'], 0) : totalCount;
    aggregatableFields.forEach((field) => {
      const count = _.get(aggregations, [...aggsPath, `${field}_count`, 'value'], 0);
      if (count > 0) {
        const cardinality = _.get(aggregations, [...aggsPath, `${field}_cardinality`, 'value'], 0);
        stats.aggregatableExistsFields.push({
          fieldName: field,
          existsInDocs: true,
          stats: {
            sampleCount,
            count,
            cardinality
          }
        });
      } else {
        stats.aggregatableNotExistsFields.push({
          fieldName: field,
          existsInDocs: false
        });
      }
    });

    return stats;
  }

  async checkNonAggregatableFieldExists(
    indexPatternTitle,
    query,
    field,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      }
    };
    filterCriteria.push({ exists: { field } });

    const resp = await this.callWithRequest('search', { index, size, body });
    return (resp.hits.total > 0);
  }

  async getDocumentCountStats(
    indexPatternTitle,
    query,
    timeFieldName,
    earliestMs,
    latestMs,
    interval
    ) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Don't use the sampler aggregation as this can lead to some potentially
    // confusing date histogram results depending on the date range of data amongst shards.
    const aggs = {
      eventRate: {
        date_histogram: {
          field: timeFieldName,
          interval: interval,
          min_doc_count: 1
        }
      }
    };

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: aggs
    };

    const resp = await this.callWithRequest('search', { index, size, body });

    const buckets = {};
    const dataByTimeBucket = _.get(resp, ['aggregations', 'eventRate', 'buckets'], []);
    _.each(dataByTimeBucket, (dataForTime) => {
      const time = dataForTime.key;
      buckets[time] = dataForTime.doc_count;
    });

    const stats = {
      documentCounts: {
        interval,
        buckets
      }
    };

    return stats;
  }

  async getNumericFieldStats(
    indexPatternTitle,
    query,
    field,
    cardinality,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Build the percents parameter which defines the percentiles to query
    // for the metric distribution data.
    // Use a fixed percentile spacing of 5%.
    const MAX_PERCENT = 100;
    const PERCENTILE_SPACING = 5;
    let count = 0;
    const percents = Array.from(Array(MAX_PERCENT / PERCENTILE_SPACING), () => count += PERCENTILE_SPACING);

    // If cardinality >= SAMPLE_TOP_TERMS_THRESHOLD, run the top terms aggregation
    // in a sampler aggregation, even if no sampling has been specified (samplerShardSize < 1).

    const aggs = {
      field_stats: {
        stats: { field }
      },
      percentiles: {
        percentiles: {
          field,
          percents: percents,
          keyed: false
        }
      }
    };

    const top = {
      terms: {
        field,
        size: 10,
        order: {
          _count: 'desc'
        }
      }
    };

    const aggsPath = this.getResponseAggregationsPath(samplerShardSize);
    let topAggsPath = aggsPath;
    let topValuesSamplerShardSize = samplerShardSize;
    if (samplerShardSize < 1 && cardinality >= SAMPLER_TOP_TERMS_THRESHOLD) {
      aggs.sample = {
        sampler: {
          shard_size: SAMPLER_TOP_TERMS_SHARD_SIZE
        },
        aggs: {
          top
        }
      };
      topAggsPath = ['sample'];
      topValuesSamplerShardSize = SAMPLER_TOP_TERMS_SHARD_SIZE;
    } else {
      aggs.top = top;
    }

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: this.buildSamplerAggregation(aggs, samplerShardSize)
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const aggregations = resp.aggregations;
    const stats = {
      fieldName: field,
      count: _.get(aggregations, [...aggsPath, 'field_stats', 'count'], 0),
      min: _.get(aggregations, [...aggsPath, 'field_stats', 'min'], 0),
      max: _.get(aggregations, [...aggsPath, 'field_stats', 'max'], 0),
      avg: _.get(aggregations, [...aggsPath, 'field_stats', 'avg'], 0),
      isTopValuesSampled: cardinality >= SAMPLER_TOP_TERMS_THRESHOLD || samplerShardSize > 0
    };

    stats.topValues = _.get(aggregations, [...topAggsPath, 'top', 'buckets'], []);
    stats.topValuesSampleSize = _.get(aggregations, [...topAggsPath, 'top', 'sum_other_doc_count'], 0);
    stats.topValuesSamplerShardSize = topValuesSamplerShardSize;
    stats.topValues.forEach((bucket) => {
      stats.topValuesSampleSize += bucket.doc_count;
    });

    if (stats.count > 0) {
      const percentiles = _.get(aggregations, [...aggsPath, 'percentiles', 'values'], []);
      const medianPercentile = _.find(percentiles, { key: 50 });
      stats.median = medianPercentile !== undefined ? medianPercentile.value : 0;
      stats.distribution = this.processDistributionData(percentiles, PERCENTILE_SPACING, stats.min);
    }

    return stats;
  }

  async getStringFieldStats(
    indexPatternTitle,
    query,
    field,
    cardinality,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // If cardinality >= SAMPLE_TOP_TERMS_THRESHOLD, run the top terms aggregation
    // in a sampler aggregation, even if no sampling has been specified (samplerShardSize < 1).

    const aggs = {};

    const top = {
      terms: {
        field,
        size: 10,
        order: {
          _count: 'desc'
        }
      }
    };

    const aggsPath = this.getResponseAggregationsPath(samplerShardSize);
    let topAggsPath = aggsPath;
    let topValuesSamplerShardSize = samplerShardSize;
    if (samplerShardSize < 1 && cardinality >= SAMPLER_TOP_TERMS_THRESHOLD) {
      aggs.sample = {
        sampler: {
          shard_size: SAMPLER_TOP_TERMS_SHARD_SIZE
        },
        aggs: {
          top
        }
      };
      topAggsPath = ['sample'];
      topValuesSamplerShardSize = SAMPLER_TOP_TERMS_SHARD_SIZE;
    } else {
      aggs.top = top;
    }

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: this.buildSamplerAggregation(aggs, samplerShardSize)
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const aggregations = resp.aggregations;
    const stats = {
      fieldName: field,
      isTopValuesSampled: cardinality >= SAMPLER_TOP_TERMS_THRESHOLD || samplerShardSize > 0
    };

    stats.topValues = _.get(aggregations, [...topAggsPath, 'top', 'buckets'], []);
    stats.topValuesSampleSize = _.get(aggregations, [...topAggsPath, 'top', 'sum_other_doc_count'], 0);
    stats.topValuesSamplerShardSize = topValuesSamplerShardSize;
    stats.topValues.forEach((bucket) => {
      stats.topValuesSampleSize += bucket.doc_count;
    });

    return stats;
  }

  async getDateFieldStats(
    indexPatternTitle,
    query,
    field,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);
    const aggs = {
      field_stats: {
        stats: { field }
      }
    };

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: this.buildSamplerAggregation(aggs, samplerShardSize)
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const aggregations = resp.aggregations;
    const aggsPath = this.getResponseAggregationsPath(samplerShardSize);
    const stats = {
      fieldName: field,
      totalCount: _.get(resp, ['hits', 'total'], 0),
      count: _.get(aggregations, [...aggsPath, 'field_stats', 'count'], 0),
      earliest: _.get(aggregations, [...aggsPath, 'field_stats', 'min']),
      latest: _.get(aggregations, [...aggsPath, 'field_stats', 'max'])
    };

    return stats;
  }

  async getBooleanFieldStats(
    indexPatternTitle,
    query,
    field,
    samplerShardSize,
    timeFieldName,
    earliestMs,
    latestMs) {

    const index = indexPatternTitle;
    const size = 0;
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);
    const aggs = {
      value_count: {
        value_count: { field }
      },
      values: {
        terms: {
          field,
          size: 2,
          order: {
            _count: 'desc'
          }
        }
      }
    };

    const body = {
      query: {
        bool: {
          filter: filterCriteria
        }
      },
      aggs: this.buildSamplerAggregation(aggs, samplerShardSize)
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const aggregations = resp.aggregations;
    const aggsPath = this.getResponseAggregationsPath(samplerShardSize);
    const stats = {
      fieldName: field,
      totalCount: _.get(resp, ['hits', 'total'], 0),
      count: _.get(aggregations, [...aggsPath, 'value_count', 'value'], 0),
      trueCount: 0,
      falseCount: 0
    };
    const valueBuckets = _.get(aggregations, [...aggsPath, 'values', 'buckets'], []);
    _.each(valueBuckets, (bucket) => {
      stats[`${bucket.key_as_string}Count`] = bucket.doc_count;
    });

    return stats;
  }

  async getDefaultAggregatableFieldStats(
    indexPatternTitle,
    query,
    field,
    timeFieldName,
    earliestMs,
    latestMs,
    maxExamples) {

    // Just return some examples of the field which will be displayed together with basic information
    // returned from the call to get overall stats on each field.

    const index = indexPatternTitle;

    // Request at least 100 docs so that we have a chance of obtaining
    // 'maxExamples' of the field.
    const size = Math.max(100, maxExamples);
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Use an exists filter to return examples of the field.
    filterCriteria.push({
      exists: { field }
    });

    const body = {
      _source: field,
      query: {
        bool: {
          filter: filterCriteria
        }
      }
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const stats = {
      fieldName: field,
      totalCount: _.get(resp, ['hits', 'total'], 0),
      examples: []
    };

    if (resp.hits.total !== 0) {
      const hits = resp.hits.hits;
      for (let i = 0; i < hits.length; i++) {
        // Look in the _source for the field value.
        // If the field is not in the _source (as will happen if the
        // field is populated using copy_to in the index mapping),
        // there will be no example to add.
        const example = _.get(hits[i]._source, field);
        if (example !== undefined && stats.examples.indexOf(example) === -1) {
          stats.examples.push(example);
          if (stats.examples.length === maxExamples) {
            break;
          }
        }
      }
    }

    return stats;
  }

  async getFieldExamples(
    indexPatternTitle,
    query,
    field,
    timeFieldName,
    earliestMs,
    latestMs,
    maxExamples) {

    const index = indexPatternTitle;

    // Request at least 100 docs so that we have a chance of obtaining
    // 'maxExamples' of the field.
    const size = Math.max(100, maxExamples);
    const filterCriteria = this.buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query);

    // Use an exists filter to return examples of the field.
    filterCriteria.push({
      exists: { field }
    });

    const body = {
      _source: field,
      query: {
        bool: {
          filter: filterCriteria
        }
      }
    };

    const resp = await this.callWithRequest('search', { index, size, body });
    const stats = {
      fieldName: field,
      examples: []
    };
    if (resp.hits.total !== 0) {
      const hits = resp.hits.hits;
      for (let i = 0; i < hits.length; i++) {
        // Look in the _source for the field value.
        // If the field is not in the _source (as will happen if the
        // field is populated using copy_to in the index mapping),
        // there will be no example to add.
        // Use lodash _.get() to support field names containing dots.
        const example = _.get(hits[i]._source, field);
        if (example !== undefined && stats.examples.indexOf(example) === -1) {
          stats.examples.push(example);
          if (stats.examples.length === maxExamples) {
            break;
          }
        }
      }
    }

    return stats;

  }

  // Builds the base filter criteria used in queries,
  // adding criteria for the time range and an optional query.
  buildBaseFilterCriteria(timeFieldName, earliestMs, latestMs, query) {
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

  // Wraps the supplied aggregations in a sampler aggregation.
  // samplerShardSize < 1 indicates no sampling.
  buildSamplerAggregation(aggs, samplerShardSize) {
    if (samplerShardSize < 1) {
      return aggs;
    }

    return {
      sample: {
        sampler: {
          shard_size: samplerShardSize
        },
        aggs
      }
    };
  }

  // Returns the aggregation path, depending on whether
  // sampling is being used (samplerShardSize < 1 indicates no sampling).
  getResponseAggregationsPath(samplerShardSize) {
    return samplerShardSize > 0 ? ['sample'] : [];
  }

  processDistributionData(percentiles, percentileSpacing, minValue) {
    const distribution = { percentiles: [], minPercentile: 0, maxPercentile: 100 };
    if (percentiles.length === 0) {
      return distribution;
    }

    let percentileBuckets = [];
    let lowerBound = minValue;
    if (lowerBound >= 0) {
      // By default return results for 0 - 90% percentiles.
      distribution.minPercentile = 0;
      distribution.maxPercentile = 90;
      percentileBuckets = percentiles.slice(0, percentiles.length - 2);

      // Look ahead to the last percentiles and process these too if
      // they don't add more than 50% to the value range.
      const lastValue = _.last(percentileBuckets).value;
      const upperBound = lowerBound + (1.5 * (lastValue - lowerBound));
      const filteredLength = percentileBuckets.length;
      for (let i = filteredLength; i < percentiles.length; i++) {
        if (percentiles[i].value < upperBound) {
          percentileBuckets.push(percentiles[i]);
          distribution.maxPercentile += percentileSpacing;
        } else {
          break;
        }
      }

    } else {
      // By default return results for 5 - 95% percentiles.
      const dataMin = lowerBound;
      lowerBound = percentiles[0].value;
      distribution.minPercentile = 5;
      distribution.maxPercentile = 95;
      percentileBuckets = percentiles.slice(1, percentiles.length - 1);

      // Add in 0-5 and 95-100% if they don't add more
      // than 25% to the value range at either end.
      const lastValue = _.last(percentileBuckets).value;
      const maxDiff = 0.25 * (lastValue - lowerBound);
      if (lowerBound - dataMin < maxDiff) {
        percentileBuckets.splice(0, 0, percentiles[0]);
        distribution.minPercentile = 0;
        lowerBound = dataMin;
      }

      if (percentiles[percentiles.length - 1].value - lastValue < maxDiff) {
        percentileBuckets.push(percentiles[percentiles.length - 1]);
        distribution.maxPercentile = 100;
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
          distribution.percentiles.push({
            percent: numEqualValueBuckets * percentileSpacing,
            minValue: lastBucketValue,
            maxValue: lastBucketValue
          });
        }

        distribution.percentiles.push({
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
          distribution.percentiles.push({
            percent: numEqualValueBuckets * percentileSpacing,
            minValue: lastBucketValue,
            maxValue: lastBucketValue
          });
        }
      }
    }

    return distribution;
  }

}
