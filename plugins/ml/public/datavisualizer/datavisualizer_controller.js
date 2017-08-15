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

import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';
import { DATA_VISUALIZER_FIELD_TYPES, KBN_FIELD_TYPES } from 'plugins/ml/constants/field_types';
import { checkLicense } from 'plugins/ml/license/check_license';

uiRoutes
.when('/datavisualizer/view', {
  template: require('./datavisualizer.html'),
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
  $timeout,
  timefilter,
  mlDataVisualizerSearchService) {

  timefilter.enabled = true;
  const indexPattern = $route.current.locals.indexPattern;

  $scope.metricConfigurations = [];
  $scope.totalMetricFieldCount = 0;
  $scope.populatedMetricFieldCount = 0;
  $scope.showAllMetrics = false;
  $scope.fieldConfigurations = [];
  $scope.totalNonMetricFieldCount = 0;
  $scope.populatedNonMetricFieldCount = 0;
  $scope.DATA_VISUALIZER_FIELD_TYPES = DATA_VISUALIZER_FIELD_TYPES;
  $scope.showAllFields = false;
  $scope.filterFieldType = '*';
  $scope.urlBasePath = chrome.getBasePath();

  $scope.indexPattern = indexPattern;
  $scope.earliest = timefilter.getActiveBounds().min.valueOf();
  $scope.latest = timefilter.getActiveBounds().max.valueOf();

  $scope.metricFilterIcon = 0;
  $scope.metricFieldFilter = '';
  $scope.fieldFilterIcon = 0;
  $scope.fieldFilter = '';

  let metricFieldRegexp;
  let metricFieldFilterTimeout;
  let fieldRegexp;
  let fieldFilterTimeout;

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

  $scope.filterFieldTypeChanged = function (fieldType) {
    $scope.filterFieldType = fieldType;
    loadNonMetricFieldList();
  };

  $scope.metricFieldFilterChanged = function () {
    // Clear the previous filter timeout.
    if (metricFieldFilterTimeout !== undefined) {
      $timeout.cancel(metricFieldFilterTimeout);
    }

    // Create a timeout to recreate the metric configurations based on the filter.
    // A timeout of 1.5s is used as the user may still be in the process of typing the filter
    // when this function is first called.
    metricFieldFilterTimeout = $timeout(() => {
      if ($scope.metricFieldFilter && $scope.metricFieldFilter !== '') {
        metricFieldRegexp = new RegExp('(' + $scope.metricFieldFilter + ')', 'gi');
      } else {
        metricFieldRegexp = undefined;
      }

      createMetricConfigurations();
      metricFieldFilterTimeout = undefined;
    }, 1500);

    // Display the spinner icon after 250ms of typing.
    // The spinner is a nice way of showing that something is
    // happening as we're stalling for the user to stop typing.
    $timeout(() => {
      $scope.metricFilterIcon = 1;
    }, 250);

  };

  $scope.clearMetricFilter = function () {
    $scope.metricFieldFilter = '';
    metricFieldRegexp = undefined;
    createMetricConfigurations();
  };

  $scope.fieldFilterChanged = function () {
    // Clear the previous filter timeout.
    if (fieldFilterTimeout !== undefined) {
      $timeout.cancel(fieldFilterTimeout);
    }

    // Create a timeout to recreate the non-metric field configurations based on the filter.
    // A timeout of 1.5s is used as the user may still be in the process of typing the filter
    // when this function is first called.
    fieldFilterTimeout = $timeout(() => {
      if ($scope.fieldFilter && $scope.fieldFilter !== '') {
        fieldRegexp = new RegExp('(' + $scope.fieldFilter + ')', 'gi');
      } else {
        fieldRegexp = undefined;
      }

      loadNonMetricFieldList();
      fieldFilterTimeout = undefined;
    }, 1500);

    // Display the spinner icon after 250ms of typing.
    // the spinner is a nice way of showing that something is
    // happening as we're stalling for the user to stop trying.
    $timeout(() => {
      $scope.fieldFilterIcon = 1;
    }, 250);
  };

  $scope.clearFieldFilter = function () {
    $scope.fieldFilter = '';
    fieldRegexp = undefined;
    loadNonMetricFieldList();
  };

  function createMetricConfigurations() {
    $scope.metricConfigurations.length = 0;

    // Strip out _score and _version.
    // TODO - shall we omit all these fields?
    const omitFields = ['_version', '_score'];

    const aggregatableExistsFields = $scope.overallStats.aggregatableExistsFields || [];

    let allMetricFields = [];
    if (metricFieldRegexp === undefined) {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER && !_.contains(omitFields, f.displayName));
      });
    } else {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER && !_.contains(omitFields, f.displayName) && f.displayName.match(metricFieldRegexp));
      });
    }
    const metricExistsFields = _.filter(allMetricFields, (f) => {
      return aggregatableExistsFields.indexOf(f.displayName) > -1;
    });

    $scope.totalMetricFieldCount = allMetricFields.length;
    $scope.populatedMetricFieldCount = metricExistsFields.length;
    if ($scope.totalMetricFieldCount === $scope.populatedMetricFieldCount) {
      $scope.showAllMetrics = true;
    }

    // Clear the filter spinner if it's running.
    $scope.metricFilterIcon = 0;

    const metricFields = $scope.showAllMetrics ? allMetricFields : metricExistsFields;
    if (metricFields.length > 0) {
      //metricFields = metricFields.slice(0, Math.min(metricFields.length, 6));

      const metricConfigs = [];

      _.each(metricFields, (field) => {
        metricConfigs.push({
          fieldName: field.displayName,
          type: DATA_VISUALIZER_FIELD_TYPES.NUMBER
        });
      });

      $scope.metricConfigurations = metricConfigs;
    }

  }

  function loadNonMetricFieldList() {
    $scope.fieldConfigurations.length = 0;

    // Strip out _source and _type.
    // TODO - shall we omit all these fields?
    const omitFields = ['_source', '_type', '_index', '_id', '_version'];

    // Get the list of field types to be displayed, and the list of all fields
    // that have these type(s), whether they occur in any documents or not.
    let fieldTypes = [];
    let allNonMetricFields = [];
    if ($scope.filterFieldType === '*') {
      // TODO - extend this list to geo, geo_point, boolean etc.
      fieldTypes = [KBN_FIELD_TYPES.STRING, KBN_FIELD_TYPES.IP, KBN_FIELD_TYPES.DATE];
      allNonMetricFields = _.filter(indexPattern.fields, (f) => {
        return (!_.contains(omitFields, f.displayName) && (_.contains(fieldTypes, f.type)));
      });
    } else {
      if ($scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.TEXT ||
            $scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.KEYWORD)  {
        fieldTypes = [KBN_FIELD_TYPES.STRING];
        const aggregatableCheck = $scope.filterFieldType === DATA_VISUALIZER_FIELD_TYPES.KEYWORD ? true : false;
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return !_.contains(omitFields, f.displayName) &&
            (f.type === KBN_FIELD_TYPES.STRING) &&
            (f.aggregatable === aggregatableCheck);
        });
      } else {
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return (!_.contains(omitFields, f.displayName) && (f.type === $scope.filterFieldType));
        });
      }
    }

    // If a field filter has been entered, perform another filter on the entered regexp.
    if (fieldRegexp !== undefined) {
      allNonMetricFields = _.filter(allNonMetricFields, (f) => {
        return (f.displayName.match(fieldRegexp));
      });
    }

    $scope.totalNonMetricFieldCount = allNonMetricFields.length;

    // Obtain the list of populated non-metric fields.
    // First add the aggregatable fields which appear in documents.
    const aggregatableNotExistsFields = $scope.overallStats.aggregatableNotExistsFields || [];
    const nonMetricFields = _.filter(allNonMetricFields, (f) => {
      return (f.aggregatable === true &&
        aggregatableNotExistsFields.indexOf(f.displayName) === -1);
    });

    // Secondly, add in non-aggregatable string fields which appear in documents.
    const nonAggFields = _.filter(allNonMetricFields, (f) => {
      return f.aggregatable === false;
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
            $scope.populatedNonMetricFieldCount = nonMetricFields.length;
            if ($scope.showAllFields) {
              createNonMetricFieldConfigurations(allNonMetricFields);
            } else {
              createNonMetricFieldConfigurations(nonMetricFields);
            }
          }
        });
      });
    } else {
      $scope.populatedNonMetricFieldCount = nonMetricFields.length;
      if ($scope.totalNonMetricFieldCount === $scope.populatedNonMetricFieldCount) {
        $scope.showAllFields = true;
      }
      if ($scope.showAllFields) {
        createNonMetricFieldConfigurations(allNonMetricFields);
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
        aggregatable: field.aggregatable,
        scripted: field.scripted
      };

      // Map the field type from the Kibana index pattern to the field type
      // used in the data visualizer.
      switch (field.type) {
        case KBN_FIELD_TYPES.DATE:
          config.type = DATA_VISUALIZER_FIELD_TYPES.DATE;
          break;
        case KBN_FIELD_TYPES.IP:
          config.type = DATA_VISUALIZER_FIELD_TYPES.IP;
          break;
        case KBN_FIELD_TYPES.STRING:
          config.type = field.aggregatable ? DATA_VISUALIZER_FIELD_TYPES.KEYWORD : DATA_VISUALIZER_FIELD_TYPES.TEXT;
          break;
        default:
          config.type = field.type;
          break;
      }

      fieldConfigs.push(config);
    });

    // Clear the filter spinner if it's running.
    $scope.fieldFilterIcon = 0;

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
