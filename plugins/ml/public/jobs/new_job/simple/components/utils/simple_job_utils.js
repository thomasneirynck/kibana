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

import { migrateFilter } from 'ui/courier/data_source/_migrate_filter.js';

export function getQueryFromSavedSearch(formConfig) {
  const must = [];
  const mustNot = [];

  must.push(formConfig.query);

  formConfig.filters.forEach(f => {
    const query = migrateFilter(f.query);
    if(f.meta.disabled === false) {
      if(f.meta.negate) {
        mustNot.push(query);
      } else {
        must.push(query);
      }
    }
  });

  return {
    bool: {
      must,
      must_not: mustNot
    }
  };
}

// if a field name contains bad characters which break elasticsearch aggregations
// use a dummy name.
// allowed characters: alpha-numeric - _ .
// e.g. field_0, field_1
export function getSafeFieldName(displayName, index) {
  return displayName.match(/^[a-zA-Z0-9-_.]+$/) ? displayName : `field_${index}`;
}
