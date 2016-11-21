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

// service for interacting with the server
// used by prelert_angular_client.js

import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlServerRequestService', ['$http', '$q', function ($http, $q) {

  this.urlBase = window.location.origin + chrome.getBasePath() + "/prelert";

  // request function returns a promise object
  // once resolved, just the data response is returned
  this.request = function(options) {
    if(options && options.url) {
      var url = options.urlBase || this.urlBase;
      url = url + (options.url || "");

      var params = options.params || {};

      var deferred = $q.defer();

      $http({
          url: url,
          method: (options.method || 'GET'),
          headers: (options.headers || {}),
          params: (options.params || {}),
          data: (options.data || null)
        })
        .then(function successCallback(response) {
          deferred.resolve(response.data);
        }, function errorCallback(response) {
          deferred.reject(response.data);
        });

      return deferred.promise;
    }
  };

}]);
