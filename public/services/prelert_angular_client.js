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

/*
Angular.js service to the Prelert Anomaly Detective Engine API. This module can simply
be injected into your angular controllers.
*/
import chrome from 'ui/chrome';
import 'plugins/prelert/services/server_request_service';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.factory('prelertAPIServices', ['$http', '$q', 'prlServerRequestService', function($http, $q, prlServerRequestService) {

  return function(config) {

    var http = prlServerRequestService;
    var prelertAPIServices = {};
    var urlBasePath = chrome.getBasePath()

    prelertAPIServices.JobsService = {
      urlBase: "/jobs",

      /**
       * Queries the Prelert Engine API to get the details of all created jobs.
       * Supply skip and take params to obtain a specific page of results.
       */
      listJobs: function() {
        return http.request({
          url: this.urlBase+"?take=1000",
        });
      },

      /**
       * Queries the Prelert Engine API to get the details of the job with the specified ID.
       */
      getJobDetails: function(params) {
        var jobId = params.jobId;
        if (jobId !== undefined) {
          return http.request({
            url: this.urlBase + "/" + jobId
          });
        } else {
          return {
            then: function() {
              return {
                catch: function(d) {
                  console.log("getJobDetails: jobId not specified");
                  d();
                }
              };
            }
          };
        }
      },

      /**
       * Updates properties of the job configuration that are mutable
       */
      updateJob: function(jobId, data) {
        if (jobId !== undefined) {
          return http.request({
            url: this.urlBase + "/" + jobId + "/update",
            method: 'PUT',
            data: data
          });
        } else {
          return {
            then: function() {
              return {
                catch: function(d) {
                  console.log("updateJob: jobId not specified");
                  d();
                }
              };
            }
          };
        }
      },

      /**
       * Deletes an existing Prelert Engine API job.
       */
      deleteJob: function(jobId) {
        if (jobId !== undefined) {
          return http.request({
            url: this.urlBase + "/" + jobId,
            method: 'DELETE'
          });
        } else {
          return {
            then: function() {
              return {
                catch: function(d) {
                  console.log("getJobDetails: jobId not specified");
                  d();
                }
              };
            }
          };
        }
      },

      /**
       * Saves a new job.
       */
      saveNewJob: function(job, params) {
        return http.request({
          url: this.urlBase,
          method: 'POST',
          params: params,
          data: job
        });
      },

      /**
       * upload data to a job.
       */
      uploadJobData: function(jobId, data) {
        return http.request({
          url: "/data/"+jobId,
          method: 'POST',
          params: {},
          data: data
        });
      },

      /**
       * call an external api specified as {url:<url>} in params
       */
      getExternalUrl: function(headers, params) {
        return http.request({
          url: "/ext",
          method: 'GET',
          headers: headers,
          urlBase: urlBasePath + "/prelert_ext", // note, used to override the "/prelert" in server_request_service.js
          params: params
        });
      },

      /**
       * post data to an external url
       */
      postExternalUrl: function(headers, url, data) {
        return http.request({
          url: "/ext",
          method: 'POST',
          headers: headers,
          urlBase: urlBasePath + "/prelert_ext", // note, used to override the "/prelert" in server_request_service.js
          params: {url:url},
          data: data
        });
      },

      /**
       * start or stop a scheduled job
       */
      schedulerControl: function(jobId, instruction, params) {
        return http.request({
          url: "/schedulers/"+jobId+"/"+instruction,
          method: 'POST',
          data: "",
          params: params
        });
      },

      /**
       * validate a detector
       */
      validateDetector: function(data) {
        return http.request({
          url: "/validate/detector/",
          method: 'POST',
          data: data
        });
      },

      /**
       * validate an array of transforms
       */
      validateTransforms: function(data) {
        return http.request({
          url: "/validate/transforms/",
          method: 'POST',
          data: data
        });
      },

      /**
       * get the Enigne's status document
       */
      status: function() {
        return http.request({
          url: "/status",
          method: 'GET'
        });
      },

    };


    prelertAPIServices.ResultsService = {
      urlBase: "/results",

      /**
       * Queries the Prelert Engine API for the bucket results for a job.
       * Optional params that can be supplied:
       *  - skip
       *  - take
       *  - start
       *  - end
       */
      getBuckets: function(jobId, params) {
        return $http.get(this.urlBase + "/" + jobId + "/buckets", {
          params: params
        });
      },

      /**
       * Queries the Prelert Engine API for a particular bucket result for a job.
       * Optionally supply an expand=true param to include the anomaly records for the bucket.
       */
      getBucket: function(jobId, bucketId, params) {
        return $http.get(this.urlBase + "/" + jobId + "/buckets/" + bucketId, {
          params: params
        });
      },

      /**
       * Queries the Prelert Engine API for the anomaly records for a job.
       * Optional params that can be supplied:
       *  - skip
       *  - take
       *  - start
       *  - end
       */
      getRecords: function(jobId, params) {
        return $http.get(this.urlBase + "/" + jobId + "/records", {
          params: params
        });
      }
    };


    return prelertAPIServices;
  };

}]);

