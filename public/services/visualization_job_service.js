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
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import 'plugins/prelert/services/prelert_angular_client';
import 'plugins/prelert/services/info_service';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlVisualizationJobService', function (
  $rootScope,
  $http,
  $q,
  es,
  prelertAPIService,
  prlInfoService,
  prlJobService
) {
  this.job = {};

  function getVisJsonFromId(id) {
    const deferred = $q.defer();
    es.search({
      index: '.kibana/visualization',
      body: {'query':{'match_all':{}}}
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        const vis = _.find(resp.hits.hits, {_id: id});
        deferred.resolve(vis);
      } else {
        deferred.reject(resp);
      }
    })
    .catch(function (resp) {
      deferred.reject(resp);
    });

    return deferred.promise;
  }

  this.getJobFromVisId = function (job, id) {
    const deferred = $q.defer();
    // const obj = {success: true, jobs: []};
    this.job = job;

    getVisJsonFromId(id)
    .then((vis) => {
      if (vis) {
        // console.log(vis);
        this.getJobFromVisJson(vis);
        deferred.resolve();
      }
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  this.getJobFromVisJson = function (visJson) {
    visJson = visJson._source;
    if (visJson.visState !== undefined && visJson.kibanaSavedObjectMeta !== undefined) {
      const visState = (typeof visJson.visState === 'string') ? JSON.parse(visJson.visState) : visJson.visState;
      const kibanaSavedObjectMeta = JSON.parse(visJson.kibanaSavedObjectMeta.searchSourceJSON);
      const index = kibanaSavedObjectMeta.index;
      const dtr = {};

      _.each(visState.aggs, (obj) => {
        if (obj.type === 'date_histogram') {
          this.job.dataDescription.timeField = obj.params.field;
          if (obj.params.customInterval !== undefined) {
            const ci = obj.params.customInterval;

          }
        }
        if (obj.schema === 'metric') {
          dtr.function = obj.type;
          if (obj.params && obj.params.field) {
            dtr.fieldName = obj.params.field;
          }
            // function: obj.type,
            // fieldName: 'responsetime',
            // byFieldName: 'airline',
            // detectorDescription: 'sum(responsetime) by airline'
        }
        if (obj.schema === 'group') {
          if (obj.params && obj.params.field) {
            dtr.byFieldName = obj.params.field;
            this.job.analysisConfig.influencers.push(obj.params.field);
            // $scope.ui.influencers.push(obj.params.field);
          }
        }
      });
      this.job.analysisConfig.detectors.push(dtr);
      this.job.dataDescription.format = 'ELASTICSEARCH';

      this.job.schedulerConfig = {
        query: {
          match_all: {}
        },
        types: [
          'response'
        ],
        dataSource: 'ELASTICSEARCH',
        dataSourceCompatibility: '2.x.x',
        queryDelay: 60,
        frequency: 150,
        baseUrl: 'http://localhost:9200',
        indexes: [index],
        retrieveWholeSource: true,
        scrollSize: 1000
      };
      this.job.id = visState.title;
      console.log('getJobFromVisJson: ', this.job);
    } else {
      console.log('getJobFromVisJson: error, visState or kibanaSavedObjectMeta not found');
    }
  };

  // not finished. in fact, completely broken
  this.getSearchJsonFromVisJson = function (visJson, config) {
    let json = {};
    visJson = visJson._source;
    if (visJson.visState !== undefined) {
      const visState = (typeof visJson.visState === 'string') ? JSON.parse(visJson.visState) : visJson.visState;
      // const kibanaSavedObjectMeta = JSON.parse(visJson.kibanaSavedObjectMeta.searchSourceJSON);

      const agg = {};
      agg[config.agg.type.name] = {field: config.field.displayName};

      json = {
        'index': config.indexPattern.id,
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
                    'time': {
                      'gte': config.start,
                      'lte': config.end,
                      'format': config.format
                    }
                  }
                }
              ],
              // must_not: []
            }
          },
          'aggs': {
            'times': {
              'date_histogram': {
                'field': 'time',
                interval: '3h',
                // 'interval': '300s',
                'min_doc_count': 1
              },
              'aggs': {
                'field_value': agg
              }
            }
          }
        }
      };
      return json;

        /*
      _.each(visState.aggs, (obj) => {
        if (obj.type === 'date_histogram') {
          this.job.dataDescription.timeField = obj.params.field;
          if (obj.params.customInterval !== undefined) {
            const ci = obj.params.customInterval;

          }
        }
        if (obj.schema === 'metric') {
          dtr.function = obj.type;
          if (obj.params && obj.params.field) {
            dtr.fieldName = obj.params.field;
          }
            // function: obj.type,
            // fieldName: 'responsetime',
            // byFieldName: 'airline',
            // detectorDescription: 'sum(responsetime) by airline'
        }
        if (obj.schema === 'group') {
          if (obj.params && obj.params.field) {
            dtr.byFieldName = obj.params.field;
            this.job.analysisConfig.influencers.push(obj.params.field);
            // $scope.ui.influencers.push(obj.params.field);
          }
        }
      });
      */
    }
    // console.log(json);
  };

});