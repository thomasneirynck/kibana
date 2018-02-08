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

module.service('mlESMappingService', function ($q, ml) {

  // Returns the mapping type of the specified field.
  // Accepts fieldName containing dots representing a nested sub-field.
  this.getFieldTypeFromMapping = function (index, fieldName) {
    return $q((resolve, reject) => {
      if (index !== '') {
        ml.getFieldCaps({ index, fields: [fieldName] })
          .then((resp) => {
            let fieldType = '';
            _.each(resp.fields, (field) => {
              _.each(field, (type) => {
                if (fieldType === '') {
                  fieldType = type.type;
                }
              });
            });
            resolve(fieldType);
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        reject();
      }
    });
  };
});
