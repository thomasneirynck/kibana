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

module.service('mlDataVisualizerSearchService', function ($q, es) {

  this.getOverallStats = function (indexPattern, query, earliestMs, latestMs) {
    const deferred = $q.defer();

    const boolCriteria = [];
    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[indexPattern.timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    boolCriteria.push(timeRangeCriteria);

    if (query) {
      boolCriteria.push(query);
    }

    const obj = {
      success: true,
      stats: {
        nonAggregatableFields: [],
        aggregatableExistsFields: [],
        aggregatableNotExistsFields: []
      }
    };

    const aggs = {};
    _.each(indexPattern.fields, (field) => {
      if (field.aggregatable) {
        aggs[field.displayName + '_value_count'] = {
          'value_count': { 'field':field.displayName }
        };
      }
    });

    es.search({
      index: indexPattern.title,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': boolCriteria
          }
        },
        'aggs' : aggs
      }
    })
    .then((resp) => {
      obj.stats.totalCount = resp.hits.total;
      const aggregations = resp.aggregations;
      _.each(indexPattern.fields, (field) => {
        const fieldName = field.displayName;
        const count = _.get(aggregations, [fieldName + '_value_count', 'value']);
        if (count !== undefined) {
          if (count > 0) {
            obj.stats.aggregatableExistsFields.push(fieldName);
          } else {
            obj.stats.aggregatableNotExistsFields.push(fieldName);
          }
        } else {
          obj.stats.nonAggregatableFields.push(fieldName);
        }
      });

      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });

    return deferred.promise;
  };

  this.nonAggregatableFieldExists = function (indexPattern, field, earliestMs, latestMs) {
    const deferred = $q.defer();
    const obj = { success: true, exists: false };

    const boolCriteria = [];
    const timeRangeCriteria = { 'range':{} };
    timeRangeCriteria.range[indexPattern.timeFieldName] = {
      'gte': earliestMs,
      'lte': latestMs,
      'format': 'epoch_millis'
    };
    boolCriteria.push(timeRangeCriteria);

    boolCriteria.push({
      'exists' : { 'field' : field }
    });

    es.search({
      index: indexPattern.title,
      size: 0,
      body: {
        'query': {
          'bool': {
            'filter': boolCriteria
          }
        }
      }
    })
    .then((resp) => {
      obj.exists = (resp.hits.total > 0);
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

});
