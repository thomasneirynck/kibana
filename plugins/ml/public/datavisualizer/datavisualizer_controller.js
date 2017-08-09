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

 /*
  * Angular controller for the Machine Learning data visualizer which allows the user
  * to explpre the data in the fields in an index pattern prior to creating a job.
  */

import _ from 'lodash';
import 'ui/courier';

import 'plugins/kibana/visualize/styles/main.less';

import uiRoutes from 'ui/routes';
import { FIELD_TYPES } from 'plugins/ml/constants/field_types';
import { checkLicense } from 'plugins/ml/license/check_license';

uiRoutes
.when('/datavisualizer/view', {
  template: require('./data_visualizer.html'),
  resolve: {
    CheckLicense: checkLicense,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index)
  }
});

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlDataVisualizerViewFields', function (
  $scope,
  $route,
  timefilter,
  mlDataVisualizerSearchService) {

  timefilter.enabled = true;
  const indexPattern = $route.current.locals.indexPattern;

  $scope.metricConfigurations = [];
  $scope.totalMetricFieldCount = 0;
  $scope.showAllMetrics = false;
  $scope.fieldConfigurations = [];
  $scope.totalNonMetricFieldCount = 0;
  $scope.showAllFields = false;

  $scope.indexPattern = indexPattern;
  $scope.earliest = timefilter.getActiveBounds().min.valueOf();
  $scope.latest = timefilter.getActiveBounds().max.valueOf();

  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', function () {
    $scope.earliest = timefilter.getActiveBounds().min.valueOf();
    $scope.latest = timefilter.getActiveBounds().max.valueOf();
    loadOverallStats();
  });

  $scope.toggleAllMetrics = function () {
    $scope.showAllMetrics = !$scope.showAllMetrics;
    createMetricConfigurations();
  };

  $scope.toggleAllFields = function () {
    $scope.showAllFields = !$scope.showAllFields;
    loadNonMetricFieldList();
  };

  function createMetricConfigurations() {
    $scope.metricConfigurations.length = 0;

    // Strip out _score and _version.
    // TODO - shall we omit all these fields?
    const omitFields = ['_version', '_score'];

    const aggregatableExistsFields = $scope.overallStats.aggregatableExistsFields || [];

    const allMetricFields = _.filter(indexPattern.fields, (f) => {
      return (!_.contains(omitFields, f.displayName) && f.type === FIELD_TYPES.NUMBER);
    });
    $scope.totalMetricFieldCount = allMetricFields.length;

    let metricFields = allMetricFields;
    if (!$scope.showAllMetrics) {
      metricFields = _.filter(allMetricFields, (f) => {
        return aggregatableExistsFields.indexOf(f.displayName) > -1;
      });
    }

    if (metricFields.length > 0) {
      //metricFields = metricFields.slice(0, Math.min(metricFields.length, 6));

      const metricConfigs = [];

      _.each(metricFields, (field) => {
        metricConfigs.push({
          fieldName: field.displayName,
          type: FIELD_TYPES.NUMBER
        });
      });

      // metricConfigs.push({
      //   fieldName: 'nginx.access.response_code',
      //   type: FIELD_TYPES.NUMBER
      // });

      $scope.metricConfigurations = metricConfigs;
    }

  }

  function loadNonMetricFieldList() {
    $scope.fieldConfigurations.length = 0;

    // Strip out _source and _type.
    // TODO - shall we omit all these fields?
    const omitFields = ['_source', '_type', '_index', '_id', '_version'];

    // List of field types which can be displayed.
    // TODO - extend this list to geo, geo_point, boolean etc?
    const fieldTypes = ['string', 'ip', 'date'];

    const aggregatableNotExistsFields = $scope.overallStats.aggregatableNotExistsFields || [];

    const allNonMetricFields = _.filter(indexPattern.fields, (f) => {
      return (!_.contains(omitFields, f.displayName) && (f.type !== FIELD_TYPES.NUMBER));
    });
    $scope.totalNonMetricFieldCount = allNonMetricFields.length;


    // Obtain the list of populated non-metric fields.
    if ($scope.showAllFields) {
      const nonMetricFields = _.filter(indexPattern.fields, (f) => {
        return (!_.contains(omitFields, f.displayName) && _.contains(fieldTypes, f.type));
      });
      createNonMetricFieldConfigurations(nonMetricFields);
    } else {
      const nonMetricFields = _.filter(indexPattern.fields, (f) => {
        return (!_.contains(omitFields, f.displayName) &&
          _.contains(fieldTypes, f.type) && f.aggregatable === true &&
          aggregatableNotExistsFields.indexOf(f.displayName) === -1);
      });

      // Only add in non-aggregatable string fields if they appear in documents.
      const nonAggFields = _.filter(indexPattern.fields, (f) => {
        return (!_.contains(omitFields, f.displayName) &&
          (_.contains(fieldTypes, f.type) && f.aggregatable === false));
      });

      if (nonAggFields.length > 0) {
        let numWaiting = nonAggFields.length;
        _.each(nonAggFields, (field) => {
          mlDataVisualizerSearchService.nonAggregatableFieldExists(indexPattern.title, field.displayName,
            indexPattern.timeFieldName, $scope.earliest, $scope.latest)
          .then((resp) => {
            if (resp.exists) {
              nonMetricFields.push(field);
            }
            numWaiting--;
          }).catch((resp) => {
            console.log(`DataVisualizer - error checking whether field ${field.displayName} exists:`, resp);
            numWaiting--;
          }).then(() => {
            if (numWaiting === 0) {
              createNonMetricFieldConfigurations(nonMetricFields);
            }
          });
        });
      } else {
        createNonMetricFieldConfigurations(nonMetricFields);
      }

    }


  }

  function createNonMetricFieldConfigurations(nonMetricFields) {
    const fieldConfigs = [];

    _.each(nonMetricFields, (field) => {
      const config = {
        fieldName: field.displayName,
        type: field.type,
        aggregatable: field.aggregatable,
        scripted: field.scripted
      };

      if (field.type === 'string') {
        config.type = field.aggregatable ? FIELD_TYPES.KEYWORD : FIELD_TYPES.TEXT;
      }
      fieldConfigs.push(config);
    });

    $scope.fieldConfigurations = fieldConfigs;
  }


  function loadOverallStats() {
    mlDataVisualizerSearchService.getOverallStats(indexPattern, $scope.earliest, $scope.latest)
    .then((resp) => {
      $scope.overallStats = resp.stats;
      createMetricConfigurations();
      loadNonMetricFieldList();
    }).catch((resp) => {
      console.log('DataVisualizer - error getting overall stats from elasticsearch:', resp);
    });
  }

  loadOverallStats();

});
