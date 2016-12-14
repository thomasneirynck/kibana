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

// service for interacting with the server
// used by prelert_angular_client.js

import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');
import { addSystemApiHeader } from 'ui/system_api';

module.service('prlServerRequestService', function ($http, $q) {

  this.urlBase = window.location.origin + chrome.getBasePath() + '/prelert';

  // request function returns a promise object
  // once resolved, just the data response is returned
  this.request = function (options) {
    if (options && options.url) {
      let url = options.urlBase || this.urlBase;
      url = url + (options.url || '');

      const params = options.params || {};
      const headers = addSystemApiHeader({});
      const allHeaders = (options.headers === undefined) ?
        headers :
        Object.assign(options.headers, headers);

      const deferred = $q.defer();

      $http({
        url: url,
        method: (options.method || 'GET'),
        headers: (allHeaders),
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

});
