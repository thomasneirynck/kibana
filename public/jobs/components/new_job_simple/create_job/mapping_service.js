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

import moment from 'moment';
import _ from 'lodash';
import 'ui/timefilter';

import anomalyUtils from 'plugins/ml/util/anomaly_utils';
import stringUtils from 'plugins/ml/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.service('mlESMappingService', function ($q, es, timefilter, mlJobService) {

  this.indexes = {};

  this.getMappings = function () {
    let deferred = $q.defer();

    mlJobService.getESMappings()
    .then(mappings => {
      this.indexes = mappings;
      deferred.resolve(mappings);

    }).catch(err => {
      console.log('getMappings:', err);
    });

    return deferred.promise;
  };

  this.getTypesFromMapping = function (index) {
    // let keys = Object.keys(indexes);
    let types = [];

    let found = false;
    let type = '';
    let ind = index.trim();

    if (ind.match(/\*/g)) {
      // use a regex to find all the indexes that match the name
      ind = ind.replace(/\*/g, '.+');
      const reg = new RegExp('^' + ind + '$');
      let tempTypes = {};

      _.each(this.indexes, (index, key) => {
        if (key.match(reg)) {
          _.each(index.types, (t, tName) => {
            tempTypes[tName] = {};
          });
        }
      });
      types = Object.keys(tempTypes);
    } else {
      types = Object.keys(this.indexes[index].types);
    }

    // remove the * mapping type
    _.each(types, (t, i) => {
      if (t === '*') {
        types.splice(i, 1);
      }
    });
    return types;
  };

  // using the field name, find out what mapping type it is from
  this.getMappingTypeFromFieldName = function (index, fieldName) {
    let found = false;
    let type = '';
    let ind = index.trim();

    if (ind.match(/\*/g)) {
      // use a regex to find all the indexes that match the name
      ind = ind.replace(/\*/g, '.+');
      const reg = new RegExp('^' + ind + '$');

      _.each(this.indexes, (index, key) => {
        if (key.match(reg)) {
          _.each(index.types, (t, tName) => {
            if (!found && t && _.has(t.properties, fieldName)) {
              found = true;
              type = tName;
            }
          });
        }
      });
    } else {
      _.each(this.indexes[index].types, (t, tName) => {
        if (!found && t && _.has(t.properties, fieldName)) {
          found = true;
          type = tName;
        }
      });
    }

    return type;
  };
});
