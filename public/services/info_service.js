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
// and for logging reporting information on usage of the Prelert plugin.

import chrome from 'ui/chrome';
import _ from 'lodash';
import $ from 'jquery';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlInfoService', ['$q', 'es', '$http', function ($q, es, $http) {

  // Returns information on the installed version of Prelert API engine,
  // specifically the API product and version numbers, server operating
  // system platform and version, and customer ID.
  this.getEngineInfo = function() {
    var deferred = $q.defer();
    var obj = {success: true, info: {}};

    es.search({
      index: 'prelert-int',
      size: 1,
      body: {
        "query": {
          "bool" : {
            "filter" : [
              {"type" : { "value" : "info" }}
            ]
          }
        },
      }
    })
    .then(function(resp) {
      if (resp.hits.total !== 0) {
        var source = _.first(resp.hits.hits)._source;
        obj.info['ver'] = source.ver;
        obj.info['appVer'] = source.appVer;
        obj.info['prelertPlatform'] = source.prelertPlatform;
        obj.info['osVer'] = source.osVer;
        obj.info['id'] = source.id;
      }
      deferred.resolve(obj);
    })
    .catch(function(resp) {
      deferred.reject(resp);
    });
    return deferred.promise;
  };

  // Logs information on usage of the Prelert plugin dashboards, specifically the
  // API product and version numbers, server operating system platform and version,
  // customer ID, time, dashboard title and action.
  this.logUsageInfo = function(extraInfo) {

    // First time client tries to log usage info, obtain the reporting.enabled config setting.
    if (this.reportingEnabled === undefined) {
      var that = this;
      $http.get(chrome.getBasePath() + '/prelert_config/reporting_enabled').then(function (resp) {
        that.reportingEnabled = resp.data.reportingEnabled;
        that.logUsageInfo(extraInfo);
      });
      return;
    }

    if (this.reportingEnabled === false) {
      return;
    }

    this.getEngineInfo()
    .then(function(resp) {
      if (resp) {
        var info = resp.info;

        // Only report usage if a customer ID has been successfully stored in the doc saved to Elasticsearch.
        if (_.has(info, 'id')) {
          var info = {
            "typ": "view",
            "prod": "BehavioralAnalytics",
            "tm": parseInt(new Date() / 1000),
            "id": info.id,
            "ver": info.ver,
            "appVer": info.appVer,
            "prelertPlatform": info.prelertPlatform,
            "osVer": info.osVer
          };

          // Add additional params supplied as an argument e.g. view, actionID.
          if (extraInfo) {
            info = _.merge(info, extraInfo);
          }

          var params = $.param(info);
          var usageURL = "http://www.prelert.com/usage/usage.php?" + params;

          // Send the request using XMLHttpRequest directly.
          // Using AngularJS $http or jQuery ajax calls result in an options pre-flight request
          // with a kbn-version request header which is not allowed by Access-Control-Allow-Headers
          // and causes an error to be displayed in the browser's JavaScript console.
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.open("GET", usageURL, true);
          xmlhttp.send();
        }
      }
    }).catch(function(resp) {
        console.log("Prelert info_service - error getting API Engine info from ES:", resp);
    });
  };


}]);
