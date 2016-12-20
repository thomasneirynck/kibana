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
import stringUtils from 'plugins/prelert/util/string_utils';
import angular from 'angular';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlDetectorFilterModal', function ($scope, $modalInstance, params, prlJobService, prlMessageBarService) {
  const msgs = prlMessageBarService;
  msgs.clear();
  $scope.title = 'Add new filter';
  $scope.detector = params.detector;
  $scope.saveLock = false;
  $scope.editMode = false;
  let index = -1;
  const add = params.add;
  const validate = params.validate;
  const dtrIndex = params.index;

  /*
  $scope.functions = [
    {id: 'count',                 uri: 'count.html#count'},
    {id: 'low_count',             uri: 'count.html#count'},
    {id: 'high_count',            uri: 'count.html#count'},
    {id: 'non_zero_count',        uri: 'count.html#non-zero-count'},
    {id: 'low_non_zero_count',    uri: 'count.html#non-zero-count'},
    {id: 'high_non_zero_count',   uri: 'count.html#non-zero-count'},
    {id: 'distinct_count',        uri: 'count.html#distinct-count'},
    {id: 'low_distinct_count',    uri: 'count.html#distinct-count'},
    {id: 'high_distinct_count',   uri: 'count.html#distinct-count'},
    {id: 'rare',                  uri: 'rare.html#rare'},
    {id: 'freq_rare',             uri: 'rare.html#freq-rare'},
    {id: 'info_content',          uri: 'info_content.html#info-content'},
    {id: 'low_info_content',      uri: 'info_content.html#info-content'},
    {id: 'high_info_content',     uri: 'info_content.html#info-content'},
    {id: 'metric',                uri: 'metric.html#metric'},
    {id: 'mean',                  uri: 'metric.html#mean'},
    {id: 'low_mean',              uri: 'metric.html#mean'},
    {id: 'high_mean',             uri: 'metric.html#mean'},
    {id: 'min',                   uri: 'metric.html#min'},
    {id: 'max',                   uri: 'metric.html#max'},
    {id: 'varp',                  uri: 'metric.html#varp'},
    {id: 'low_varp',              uri: 'metric.html#varp'},
    {id: 'high_varp',             uri: 'metric.html#varp'},
    {id: 'sum',                   uri: 'sum.html#sum'},
    {id: 'low_sum',               uri: 'sum.html#sum'},
    {id: 'high_sum',              uri: 'sum.html#sum'},
    {id: 'non_null_sum',          uri: 'sum.html#non-null-sum'},
    {id: 'low_non_null_sum',      uri: 'sum.html#non-null-sum'},
    {id: 'high_non_null_sum',     uri: 'sum.html#non-null-sum'},
    {id: 'time_of_day',           uri: 'time.html#time-of-day'},
    {id: 'time_of_week',          uri: 'time.html#time-of-week'},
    {id: 'lat_long',              uri: 'geographic.html'},
  ];
*/
  $scope.fields = [];
  if ($scope.detector.field_name) {
    $scope.fields.push($scope.detector.field_name);
  }
  if ($scope.detector.by_field_name) {
    $scope.fields.push($scope.detector.by_field_name);
  }
  if ($scope.detector.over_field_name) {
    $scope.fields.push($scope.detector.over_field_name);
  }
  if ($scope.detector.partition_field_name) {
    $scope.fields.push($scope.detector.partition_field_name);
  }


  // creating a new filter
  if (params.filter === undefined) {
    $scope.filter = {
      ruleAction: 'FILTER_RESULTS',
      targetFieldName: '',
      targetFieldValue: '',
      conditionsConnective: 'OR',
      ruleConditions: [],
      valueList: []
    };
  } else {
    // edting an existing filter
    $scope.editMode = true;
    $scope.filter = params.filter;
    $scope.title = 'Edit filter';
    index = params.index;
  }

  $scope.ui = {
    ruleAction:['FILTER_RESULTS'],
    targetFieldName: '',
    targetFieldValue: '',
    conditionsConnective: ['OR', 'AND'],
    ruleCondition: {
      conditionType: [{
        label: 'actual',
        value: 'NUMERICAL_ACTUAL'
      },{
        label: 'typical',
        value: 'NUMERICAL_TYPICAL'
      }, {
        label: '|actual - typical|',
        value: 'NUMERICAL_DIFF_ABS'
      }/*, {
        label: 'Categorical',
        value: 'CATEGORICAL'
      }*/
      ],
      fieldName: '',
      fieldValue: '',
      condition: {
        operator: [{
          label:'<',
          value: 'LT'
        }, {
          label: '>',
          value: 'GT'
        }, {
          label: '<=',
          value: 'LTE'
        }, {
          label: '>=',
          value: 'GTE'
        }]
      },
      valueList: []
    }
  };

  $scope.addNewCondition = function () {
    $scope.filter.ruleConditions.push({
      conditionType: 'NUMERICAL_ACTUAL',
      fieldName: '',
      fieldValue: '',
      condition: {
        operator: 'LT',
        value: ''
      }
    });
  };

  $scope.removeCondition = function (index) {
    $scope.filter.ruleConditions.splice(index, 1);
  };


  // console.log('PrlDetectorFilterModal detector:', $scope.detector)

  $scope.helpLink = {};

  // $scope.functionChange = function() {
  //   const func = _.findWhere($scope.functions, {id: $scope.detector.function});
  //   $scope.helpLink.uri = 'functions/';
  //   $scope.helpLink.label = 'Help for ';

  //   if (func) {
  //     $scope.helpLink.uri += func.uri;
  //     $scope.helpLink.label += func.id;
  //   } else {
  //     $scope.helpLink.uri += 'functions.html';
  //     $scope.helpLink.label += 'analytical functions';
  //   }
  // };

  // $scope.functionChange();

  $scope.save = function () {
    const filter = angular.copy($scope.filter);

    if (!filter.ruleConditions.length) {
      return;
    }
    $scope.saveLock = true;

    // remove any properties that aren't being used
    if (filter.targetFieldName === '') {
      delete filter.targetFieldName;
    }
    if (filter.targetFieldValue === '') {
      delete filter.targetFieldValue;
    }

    _.each(filter.ruleConditions, (cond) => {
      delete cond.$$hashKey;
      if (cond.fieldName === '') {
        delete cond.fieldName;
      }
      if (cond.fieldValue === '') {
        delete cond.fieldValue;
      }
    });

    if (filter.valueList && filter.valueList.length === 0) {
      delete filter.valueList;
    }

    // make a local copy of the detector, add the new fitler
    // and send it off for validation.
    // if it passes, add the filter to the real detector.
    const dtr = angular.copy($scope.detector);
    if (dtr.detector_rules === undefined) {
      dtr.detector_rules = [];
    }

    if (index >= 0) {
      dtr.detector_rules[index] = filter;
    } else {
      dtr.detector_rules.push(filter);
    }

    validate(dtr)
      .then((resp) => {
        msgs.clear();
        $scope.saveLock = false;
        if (resp.success) {
          add($scope.detector, filter, index);

          // console.log('save:', filter);
          $modalInstance.close();

        } else {
          msgs.error(resp.message);
        }
      });
  };

  $scope.cancel = function () {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
