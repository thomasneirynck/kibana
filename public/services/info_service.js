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

// Service for obtaining information on the installed version of the Ml API engine,

import _ from 'lodash';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlInfoService', ['$q', 'es', '$http', function ($q, es) {

  // Returns information on the installed version of Ml API engine,
  // specifically the API product and version numbers, server operating
  // system platform and version, and customer ID.
  this.getEngineInfo = function () {
    const deferred = $q.defer();
    const obj = {success: true, info: {}};

    es.search({
      index: 'ml-int',
      size: 1,
      body: {
        'query': {
          'bool' : {
            'filter' : [
              {'type' : { 'value' : 'info' }}
            ]
          }
        },
      }
    })
    .then((resp) => {
      if (resp.hits.total !== 0) {
        const source = _.first(resp.hits.hits)._source;
        obj.info.ver = source.ver;
        obj.info.appVer = source.appVer;
        obj.info.mlPlatform = source.mlPlatform;
        obj.info.osVer = source.osVer;
        obj.info.id = source.id;
      }
      deferred.resolve(obj);
    })
    .catch((resp) => {
      deferred.reject(resp);
    });
    return deferred.promise;
  };
}]);
