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

// create items used for searching and job creation.
// takes the $route object to retrieve the indexPattern and savedSearch from the url
export function createSearchItems($route) {
  let indexPattern = $route.current.locals.indexPattern;
  const query = {
    query_string: {
      analyze_wildcard: true,
      query: '*'
    }
  };

  let filters = [];
  const savedSearch = $route.current.locals.savedSearch;
  const searchSource = savedSearch.searchSource;


  if (indexPattern.id === undefined &&
    savedSearch.id !== undefined) {
    indexPattern = searchSource.get('index');
    const q = searchSource.get('query');
    if (q !== undefined && q.language === 'lucene' && q.query !== '') {
      query.query_string.query = q.query;
    }

    const fs = searchSource.get('filter');
    if (fs.length) {
      filters = fs;
    }

  }
  const combinedQuery = getQueryFromSavedSearch({ query, filters });

  return {
    indexPattern,
    savedSearch,
    filters,
    query,
    combinedQuery
  };
}
