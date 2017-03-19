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
import angular from 'angular';

function filterAggTypes(aggTypes) {
  const filteredAggTypes = [];
  let typeCopy;
  _.each(aggTypes, (type) => {
    type.mlName = type.name;
    type.mlModelPlotAgg = {max:type.name, min: type.name};

    _.each(type.params, (p) => {
      if (p.filterFieldTypes && typeof p.filterFieldTypes === 'string') {
        p.filterFieldTypes = p.filterFieldTypes.replace(',date', '');
      }
    });

    if (type.name === 'count') {
      type.mlModelPlotAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(type);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'high_count';
      typeCopy.title   = 'High count';
      typeCopy.mlModelPlotAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'low_count';
      typeCopy.title   = 'Low count';
      typeCopy.mlModelPlotAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'sum') {
      filteredAggTypes.push(type);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'high_sum';
      typeCopy.title   = 'High sum';
      filteredAggTypes.push(typeCopy);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'low_sum';
      typeCopy.title   = 'Low sum';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'avg') {
      type.mlName = 'mean';
      filteredAggTypes.push(type);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'high_mean';
      typeCopy.title   = 'High average';
      filteredAggTypes.push(typeCopy);

      typeCopy = angular.copy(type);
      typeCopy.mlName = 'low_mean';
      typeCopy.title   = 'Low average';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'min') {
      filteredAggTypes.push(type);
    } else if (type.name === 'max') {
      filteredAggTypes.push(type);
    } else if (type.name === 'cardinality') {
      type.mlModelPlotAgg = {max: 'max', min: 'min'};
      type.mlName = 'distinct_count';

      _.each(type.params, (p) => {
        if (p.filterFieldTypes) {
          p.filterFieldTypes = 'number,boolean,ip,string';
        }
      });

      filteredAggTypes.push(type);
    }
  });
  return filteredAggTypes;
}

module.exports = filterAggTypes;
