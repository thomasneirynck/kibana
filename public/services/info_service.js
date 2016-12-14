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

// Service for obtaining information on the installed version of the Prelert API engine,

import chrome from 'ui/chrome';
import _ from 'lodash';
import $ from 'jquery';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlInfoService', ['$q', 'es', '$http', function ($q, es, $http) {

  // Returns information on the installed version of Prelert API engine,
  // specifically the API product and version numbers, server operating
  // system platform and version, and customer ID.
  this.getEngineInfo = function () {
    const deferred = $q.defer();
    const obj = {success: true, info: {}};

    es.search({
      index: 'prelert-int',
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
        var source = _.first(resp.hits.hits)._source;
        obj.info.ver = source.ver;
        obj.info.appVer = source.appVer;
        obj.info.prelertPlatform = source.prelertPlatform;
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
