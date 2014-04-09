/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
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
 * on +44 (0)20 7953 7243 or email to legal@prelert.com.    *
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

define([
  'angular',
  'app',
  'lodash'
],
function (angular, app, _) {
  'use strict';

  angular
    .module('kibana.directives')
    .directive('prelertLogUsage', function($http) {
      return {
        restrict: 'E',
        link: function(scope, element, attr) {
          
          scope.$on('refresh',function(){ 
              log_usage();
          });
          
          function log_usage() {
              // Sends basic usage information on the Prelert Engine API results dashboard to Prelert, 
              // specifically the API product and version number, customer ID, time, dashboard title
              // Engine API platform, OS version and the Job ID.
              
              // Get basic data on the Prelert Engine API from the usage type in the prelert-int index. 
              var request = scope.ejs.Request().indices('prelert-int').types('usage');
              request.query(
                      ejs.IdsQuery('usageStats')
                ).size(1);
              
              var results = request.doSearch();
              results.then(function(results) {
                  var hits = results.hits.hits;
                  if (_.size(hits) > 0) {
                      var usageStats = _.first(hits)._source;  
                      var params = $.param({
                            "typ": "view",
                            "prod": "engineAPI",
                            "tm": parseInt(new Date() / 1000),
                            "id": usageStats.customerId,
                            "ver": usageStats.ver,
                            "appVer": usageStats.appVer,
                            "prelertPlatform": usageStats.prelertPlatform,
                            "osVer": usageStats.osVer,
                            "view": scope.dashboard.current.title,
                            "jobID": scope.dashboard.current.index.default
                          });
                      console.log("prelertLogUsage log_usage() with params: " + params);
                      var usageURL = "http://www.prelert.com/usage/usage.php?" + params;
                      //$http({
                      //    url: usageURL,
                      //    method: "GET"
                      //});
                  }
              });
              
          }
          
        }
      };
    });
});