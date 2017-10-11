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
  * to explore the data in the fields in an index pattern prior to creating a job.
  */

import _ from 'lodash';
import 'ui/courier';

import 'plugins/kibana/visualize/styles/main.less';

import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';
import { luceneStringToDsl } from 'ui/courier/data_source/build_query/lucene_string_to_dsl.js';
import { DecorateQueryProvider } from 'ui/courier/data_source/_decorate_query';

import { ML_JOB_FIELD_TYPES, KBN_FIELD_TYPES } from 'plugins/ml/../common/constants/field_types';
import { kbnTypeToMLJobType } from 'plugins/ml/util/field_types_utils';
import { checkLicense } from 'plugins/ml/license/check_license';
import template from './datavisualizer.html';

uiRoutes
.when('/datavisualizer/view', {
  template,
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
  Private,
  timefilter,
  AppState,
  ml) {

  timefilter.enabled = true;
  const indexPattern = $route.current.locals.indexPattern;

  // List of system fields we don't want to display.
  // TODO - are we happy to ignore these fields?
  const OMIT_FIELDS = ['_source', '_type', '_index', '_id', '_version', '_score'];

  $scope.metricCards = [];
  $scope.totalMetricFieldCount = 0;
  $scope.populatedMetricFieldCount = 0;
  $scope.showAllMetrics = false;
  $scope.fieldCards = [];
  $scope.totalNonMetricFieldCount = 0;
  $scope.populatedNonMetricFieldCount = 0;
  $scope.ML_JOB_FIELD_TYPES = ML_JOB_FIELD_TYPES;
  $scope.showAllFields = false;
  $scope.filterFieldType = '*';
  $scope.urlBasePath = chrome.getBasePath();
  $scope.appState = new AppState();

  $scope.indexPattern = indexPattern;
  $scope.earliest = timefilter.getActiveBounds().min.valueOf();
  $scope.latest = timefilter.getActiveBounds().max.valueOf();

  $scope.metricFilterIcon = 0;
  $scope.metricFieldFilter = '';
  $scope.fieldFilterIcon = 0;
  $scope.fieldFilter = '';

  // Check for a saved query in the AppState.
  $scope.searchQueryText = '';
  if (_.has($scope.appState, 'query')) {
    // Currently only support lucene syntax.
    if (_.get($scope.appState, 'query.language') === 'lucene') {
      $scope.searchQueryText = _.get($scope.appState, 'query.query', '');
    }
  }
  const decorateQuery = Private(DecorateQueryProvider);
  $scope.searchQuery = buildSearchQuery();

  let metricFieldRegexp;
  let metricFieldFilterTimeout;
  let fieldRegexp;
  let fieldFilterTimeout;

  // Obtain the list of non metric field types which appear in the index pattern.
  let indexedFieldTypes = [];
  _.each(indexPattern.fields, (field) => {
    if (!field.scripted) {
      const dataVisualizerType = kbnTypeToMLJobType(field);
      if (dataVisualizerType !== undefined) {
        indexedFieldTypes.push(dataVisualizerType);
      }
    }
  });
  indexedFieldTypes = _.chain(indexedFieldTypes)
      .unique()
      .without(ML_JOB_FIELD_TYPES.NUMBER)
      .value();
  $scope.indexedFieldTypes = indexedFieldTypes.sort();

  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', function () {
    $scope.earliest = timefilter.getActiveBounds().min.valueOf();
    $scope.latest = timefilter.getActiveBounds().max.valueOf();
    loadOverallStats();
  });

  $scope.submitSearchQuery = function () {
    $scope.searchQuery = buildSearchQuery();
    saveAppState();
    loadOverallStats();
  };

  $scope.toggleAllMetrics = function () {
    $scope.showAllMetrics = !$scope.showAllMetrics;
    createMetricCards();
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

      createMetricCards();
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
    createMetricCards();
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

  function buildSearchQuery() {
    const query = luceneStringToDsl($scope.searchQueryText);
    decorateQuery(query);
    return query;
  }

  function saveAppState() {
    $scope.appState.query = {
      language:'lucene',
      query: $scope.searchQueryText
    };
    $scope.appState.save();
  }

  function createMetricCards() {
    $scope.metricCards.length = 0;

    const aggregatableExistsFields = $scope.overallStats.aggregatableExistsFields || [];

    let allMetricFields = [];
    if (metricFieldRegexp === undefined) {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER && !_.contains(OMIT_FIELDS, f.displayName));
      });
    } else {
      allMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type === KBN_FIELD_TYPES.NUMBER &&
          !_.contains(OMIT_FIELDS, f.displayName) &&
          f.displayName.match(metricFieldRegexp));
      });
    }

    const metricExistsFields = _.filter(allMetricFields, (f) => {
      return aggregatableExistsFields.indexOf(f.displayName) > -1;
    });

    const metricCards = [];

    // Add a config for 'document count', identified by no field name.
    // Loading currently done by the chart directive, so set flag to false.
    metricCards.push({
      type: ML_JOB_FIELD_TYPES.NUMBER,
      existsInDocs: true,
      loading: false
    });

    // Add on 1 for the document count card.
    // TODO - remove the '+1' if document count goes in its own section.
    $scope.totalMetricFieldCount = allMetricFields.length + 1;
    $scope.populatedMetricFieldCount = metricExistsFields.length + 1;
    if ($scope.totalMetricFieldCount === $scope.populatedMetricFieldCount) {
      $scope.showAllMetrics = true;
    }

    const metricFields = $scope.showAllMetrics ? allMetricFields : metricExistsFields;
    _.each(metricFields, (field) => {
      metricCards.push({
        fieldName: field.displayName,
        fieldFormat: field.format,
        type: ML_JOB_FIELD_TYPES.NUMBER,
        existsInDocs: aggregatableExistsFields.indexOf(field.displayName) > -1,
        loading: true
      });
    });

    $scope.metricCards = metricCards;
    loadMetricFieldStats();
  }

  function loadNonMetricFieldList() {
    $scope.fieldCards.length = 0;

    let allNonMetricFields = [];
    if ($scope.filterFieldType === '*') {
      allNonMetricFields = _.filter(indexPattern.fields, (f) => {
        return (f.type !== KBN_FIELD_TYPES.NUMBER && !_.contains(OMIT_FIELDS, f.displayName));
      });
    } else {
      if ($scope.filterFieldType === ML_JOB_FIELD_TYPES.TEXT ||
            $scope.filterFieldType === ML_JOB_FIELD_TYPES.KEYWORD)  {
        const aggregatableCheck = $scope.filterFieldType === ML_JOB_FIELD_TYPES.KEYWORD ? true : false;
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return !_.contains(OMIT_FIELDS, f.displayName) &&
            (f.type === KBN_FIELD_TYPES.STRING) &&
            (f.aggregatable === aggregatableCheck);
        });
      } else {
        allNonMetricFields = _.filter(indexPattern.fields, (f) => {
          return (!_.contains(OMIT_FIELDS, f.displayName) && (f.type === $scope.filterFieldType));
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

    // Obtain the list of all non-metric fields which appear in documents
    // (aggregatable or not aggregatable).
    const nonMetricFields = [];
    const nonMetricExistsFieldNames = [];
    _.each(allNonMetricFields, (f) => {
      if ($scope.overallStats.aggregatableExistsFields.indexOf(f.displayName) > -1 ||
          $scope.overallStats.nonAggregatableExistsFields.indexOf(f.displayName) > -1) {
        nonMetricFields.push(f);
        nonMetricExistsFieldNames.push(f.displayName);
      }
    });

    $scope.populatedNonMetricFieldCount = nonMetricFields.length;
    if ($scope.totalNonMetricFieldCount === $scope.populatedNonMetricFieldCount) {
      $scope.showAllFields = true;
    }

    if ($scope.showAllFields) {
      createNonMetricFieldConfigurations(allNonMetricFields, nonMetricExistsFieldNames);
    } else {
      createNonMetricFieldConfigurations(nonMetricFields, nonMetricExistsFieldNames);
    }

  }

  function createNonMetricFieldConfigurations(nonMetricFields, nonMetricExistsFieldNames) {
    const fieldCards = [];

    _.each(nonMetricFields, (field) => {
      const card = {
        fieldName: field.displayName,
        fieldFormat: field.format,
        aggregatable: field.aggregatable,
        scripted: field.scripted,
        existsInDocs: nonMetricExistsFieldNames.indexOf(field.displayName) > -1,
        loading: true
      };

      // Map the field type from the Kibana index pattern to the field type
      // used in the data visualizer.
      const dataVisualizerType = kbnTypeToMLJobType(field);
      if (dataVisualizerType !== undefined) {
        card.type = dataVisualizerType;
      } else {
        // Add a flag to indicate that this is one of the 'other' Kibana
        // field types that do not yet have a specific card type.
        card.type = field.type;
        card.isUnsupportedType = true;
      }

      fieldCards.push(card);
    });

    $scope.fieldCards = _.sortBy(fieldCards, 'fieldName');
    loadNonMetricFieldStats();
  }

  function loadMetricFieldStats() {
    // Request data for all the metric cards, apart from the document count card
    // which loads its own data (as the chart bucket aggregation interval is dependant
    // on the width of the card).
    const cardsToLoad = _.filter($scope.metricCards, (card) => {
      return card.fieldName !== undefined;
    });
    const numberFields = _.map(cardsToLoad, (card) => {
      return { fieldName: card.fieldName, type: card.type };
    });

    //console.log(`loadMetricFieldStats called at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));
    ml.getVisualizerFieldStats({
      indexPatternTitle: indexPattern.title,
      query: $scope.searchQuery,
      timeFieldName: indexPattern.timeFieldName,
      earliest: $scope.earliest,
      latest: $scope.latest,
      fields: numberFields
    })
    .then((resp) => {
      //console.log(`loadMetricFieldStats response received at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));
      // Match up the data to the card.
      _.each(cardsToLoad, (card) => {
        card.stats = _.find(resp, { fieldName: card.fieldName });
        card.loading = false;
      });

      // Clear the filter spinner if it's running.
      $scope.metricFilterIcon = 0;
    })
    .catch((resp) => {
      // TODO - display error in cards saying data could not be loaded.
      console.log('DataVisualizer - error getting stats for metric cards from elasticsearch:', resp);
    });


  }

  function loadNonMetricFieldStats() {
    const fields = _.map($scope.fieldCards, (card) => {
      return { fieldName: card.fieldName, type: card.type };
    });

    //console.log(`loadNonMetricFieldStats called at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));
    ml.getVisualizerFieldStats({
      indexPatternTitle: indexPattern.title,
      query: $scope.searchQuery,
      fields: fields,
      timeFieldName: indexPattern.timeFieldName,
      earliest: $scope.earliest,
      latest: $scope.latest,
      maxExamples: 10
    })
    .then((resp) => {
      //console.log(`loadNonMetricFieldStats response received at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));

      // Match up the data to the card.
      _.each($scope.fieldCards, (card) => {
        card.stats = _.find(resp, { fieldName: card.fieldName });
        card.loading = false;
      });

      // Clear the filter spinner if it's running.
      $scope.fieldFilterIcon = 0;
    });
  }

  function loadOverallStats() {
    //console.log(`loadOverallStats called at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));

    const aggregatableFields = [];
    const nonAggregatableFields = [];
    _.each(indexPattern.fields, (field) => {
      if (OMIT_FIELDS.indexOf(field.displayName) === -1) {
        if (field.aggregatable === true) {
          aggregatableFields.push(field.displayName);
        } else {
          nonAggregatableFields.push(field.displayName);
        }
      }
    });

    // Need to find:
    // 1. List of aggregatable fields that do exist in docs
    // 2. List of aggregatable fields that do not exist in docs
    // 3. List of non-aggregatable fields that do exist in docs.
    // 4. List of non-aggregatable fields that do not exist in docs.
    ml.getVisualizerOverallStats({
      indexPatternTitle: indexPattern.title,
      query: $scope.searchQuery,
      timeFieldName: indexPattern.timeFieldName,
      earliest: $scope.earliest,
      latest: $scope.latest,
      aggregatableFields: aggregatableFields,
      nonAggregatableFields: nonAggregatableFields
    })
    .then((resp) => {
      //console.log(`loadOverallStats server response received at`, moment().format('MMMM Do YYYY, HH:mm:ss:SS'));
      $scope.overallStats = resp;
      createMetricCards();
      loadNonMetricFieldList();
    })
    .catch((resp) => {
      // TODO - display error in cards saying data could not be loaded.
      console.log('DataVisualizer - error getting overall stats from elasticsearch:', resp);
    });

  }

  loadOverallStats();

});
