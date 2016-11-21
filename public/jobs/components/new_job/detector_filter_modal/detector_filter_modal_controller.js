/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */

import _ from 'lodash';
import stringUtils from 'plugins/prelert/util/string_utils';
import "./styles/main.less";

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlDetectorFilterModal', function ($scope, $modalInstance, params, prlJobService, prlMessageBarService) {
  var msgs = prlMessageBarService;
  msgs.clear();
  $scope.title = "Add new filter";
  $scope.detector = params.detector;
  $scope.saveLock = false;
  $scope.editMode = false;
  var index = -1;
  var add = params.add;
  var validate = params.validate;
  var dtrIndex = params.index;

  /*
  $scope.functions = [
    {id: "count",                 uri: "count.html#count"},
    {id: "low_count",             uri: "count.html#count"},
    {id: "high_count",            uri: "count.html#count"},
    {id: "non_zero_count",        uri: "count.html#non-zero-count"},
    {id: "low_non_zero_count",    uri: "count.html#non-zero-count"},
    {id: "high_non_zero_count",   uri: "count.html#non-zero-count"},
    {id: "distinct_count",        uri: "count.html#distinct-count"},
    {id: "low_distinct_count",    uri: "count.html#distinct-count"},
    {id: "high_distinct_count",   uri: "count.html#distinct-count"},
    {id: "rare",                  uri: "rare.html#rare"},
    {id: "freq_rare",             uri: "rare.html#freq-rare"},
    {id: "info_content",          uri: "info_content.html#info-content"},
    {id: "low_info_content",      uri: "info_content.html#info-content"},
    {id: "high_info_content",     uri: "info_content.html#info-content"},
    {id: "metric",                uri: "metric.html#metric"},
    {id: "mean",                  uri: "metric.html#mean"},
    {id: "low_mean",              uri: "metric.html#mean"},
    {id: "high_mean",             uri: "metric.html#mean"},
    {id: "min",                   uri: "metric.html#min"},
    {id: "max",                   uri: "metric.html#max"},
    {id: "varp",                  uri: "metric.html#varp"},
    {id: "low_varp",              uri: "metric.html#varp"},
    {id: "high_varp",             uri: "metric.html#varp"},
    {id: "sum",                   uri: "sum.html#sum"},
    {id: "low_sum",               uri: "sum.html#sum"},
    {id: "high_sum",              uri: "sum.html#sum"},
    {id: "non_null_sum",          uri: "sum.html#non-null-sum"},
    {id: "low_non_null_sum",      uri: "sum.html#non-null-sum"},
    {id: "high_non_null_sum",     uri: "sum.html#non-null-sum"},
    {id: "time_of_day",           uri: "time.html#time-of-day"},
    {id: "time_of_week",          uri: "time.html#time-of-week"},
    {id: "lat_long",              uri: "geographic.html"},
  ];
*/
  $scope.fields = [];
  if($scope.detector.fieldName) {
    $scope.fields.push($scope.detector.fieldName);
  }
  if($scope.detector.byFieldName) {
    $scope.fields.push($scope.detector.byFieldName);
  }
  if($scope.detector.overFieldName) {
    $scope.fields.push($scope.detector.overFieldName);
  }
  if($scope.detector.partitionFieldName) {
    $scope.fields.push($scope.detector.partitionFieldName);
  }


  // creating a new filter
  if(params.filter === undefined) {
    $scope.filter = {
      ruleAction: "FILTER_RESULTS",
      targetFieldName: "",
      targetFieldValue: "",
      conditionsConnective: "OR",
      ruleConditions: [],
      valueList: []
    };
  } else {
    // edting an existing filter
    $scope.editMode = true;
    $scope.filter = params.filter;
    $scope.title = "Edit filter";
    index = params.index;
  }

  $scope.ui = {
    ruleAction:["FILTER_RESULTS"],
    targetFieldName: "",
    targetFieldValue: "",
    conditionsConnective: ["OR", "AND"],
    ruleCondition: {
      conditionType: [{
          label: "actual",
          value: "NUMERICAL_ACTUAL"
        },{
          label: "typical",
          value: "NUMERICAL_TYPICAL"
        }, {
          label: "|actual - typical|",
          value: "NUMERICAL_DIFF_ABS"
        }/*, {
          label: "Categorical",
          value: "CATEGORICAL"
        }*/
      ],
      fieldName: "",
      fieldValue: "",
      condition: {
        operator: [{
            label:"<",
            value: "LT"
          }, {
            label: ">",
            value: "GT"
          }, {
            label: "<=",
            value: "LTE"
          }, {
            label: ">=",
            value: "GTE"
          }
        ]
      },
      valueList: []
    }
  };

  $scope.addNewCondition = function() {
    $scope.filter.ruleConditions.push({
      conditionType: "NUMERICAL_ACTUAL",
      fieldName: "",
      fieldValue: "",
      condition: {
        operator: "LT",
        value: ""
      }
    });
  };

  $scope.removeCondition = function(index) {
    $scope.filter.ruleConditions.splice(index, 1);
  };


  // console.log("PrlDetectorFilterModal detector:", $scope.detector)

  $scope.helpLink = {};

  // $scope.functionChange = function() {
  //   var func = _.findWhere($scope.functions, {id: $scope.detector.function});
  //   $scope.helpLink.uri = "functions/";
  //   $scope.helpLink.label = "Help for ";

  //   if(func) {
  //     $scope.helpLink.uri += func.uri;
  //     $scope.helpLink.label += func.id;
  //   } else {
  //     $scope.helpLink.uri += "functions.html";
  //     $scope.helpLink.label += "analytical functions";
  //   }
  // };

  // $scope.functionChange();

  $scope.save = function() {
    var filter = angular.copy($scope.filter);

    if(!filter.ruleConditions.length) {
      return;
    }
    $scope.saveLock = true;

    // remove any properties that aren't being used
    if(filter.targetFieldName === "") {
      delete filter.targetFieldName;
    }
    if(filter.targetFieldValue === "") {
      delete filter.targetFieldValue;
    }

    _.each(filter.ruleConditions, function(cond) {
      delete cond.$$hashKey;
      if(cond.fieldName === "") {
        delete cond.fieldName;
      }
      if(cond.fieldValue === "") {
        delete cond.fieldValue;
      }
    });

    if(filter.valueList && filter.valueList.length === 0) {
      delete filter.valueList;
    }

    // make a local copy of the detector, add the new fitler
    // and send it off for validation.
    // if it passes, add the filter to the real detector.
    var dtr = angular.copy($scope.detector);
    if(dtr.detectorRules === undefined) {
      dtr.detectorRules = [];
    }

    if(index >= 0) {
      dtr.detectorRules[index] = filter;
    } else {
      dtr.detectorRules.push(filter);
    }

    validate(dtr)
      .then(function(resp) {
        msgs.clear();
        $scope.saveLock = false ;
        if(resp.success) {
          add($scope.detector, filter, index);

          // console.log("save:", filter);
          $modalInstance.close();

        } else {
          msgs.error(resp.message);
        }
      });
  };

  $scope.cancel = function() {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
