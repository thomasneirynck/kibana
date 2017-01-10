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

/*
Angular.js service to the Ml Anomaly Detective Engine API. This module can simply
be injected into your angular controllers.
*/
import chrome from 'ui/chrome';
import 'plugins/ml/services/server_request_service';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlAPIService', function ($http, $q, mlServerRequestService) {

  const http = mlServerRequestService;
  const urlBasePath = chrome.getBasePath();

  const urlBase = '/jobs';

  /**
   * Queries the Ml Engine API to get the details of all created jobs.
   * Supply skip and take params to obtain a specific page of results.
   */
  this.listJobs = function () {
    return http.request({
      url: urlBase + '?take=1000',
    });
  };

  /**
   * Queries the Ml Engine API to get the details of the job with the specified ID.
   */
  this.getJobDetails = function (params) {
    const jobId = params.jobId;
    if (jobId !== undefined) {
      return http.request({
        url: urlBase + '/' + jobId
      });
    } else {
      return {
        then: function () {
          return {
            catch: function (d) {
              console.log('getJobDetails: jobId not specified');
              d();
            }
          };
        }
      };
    }
  };

  /**
   * Updates properties of the job configuration that are mutable
   */
  this.updateJob = function (jobId, data) {
    if (jobId !== undefined) {
      return http.request({
        url: urlBase + '/' + jobId + '/update',
        method: 'PUT',
        data: data
      });
    } else {
      return {
        then: function () {
          return {
            catch: function (d) {
              console.log('updateJob: jobId not specified');
              d();
            }
          };
        }
      };
    }
  };

  /**
   * Deletes an existing Ml Engine API job.
   */
  this.deleteJob = function (jobId) {
    if (jobId !== undefined) {
      return http.request({
        url: urlBase + '/' + jobId,
        method: 'DELETE'
      });
    } else {
      return {
        then: function () {
          return {
            catch: function (d) {
              console.log('getJobDetails: jobId not specified');
              d();
            }
          };
        }
      };
    }
  };

  /**
   * Saves a new job.
   */
  this.saveNewJob = function (job, params) {
    return http.request({
      url: urlBase,
      method: 'POST',
      params: params,
      data: job
    });
  };

  /**
   * upload data to a job.
   */
  this.uploadJobData = function (jobId, data) {
    return http.request({
      url: '/data/' + jobId,
      method: 'POST',
      params: {},
      data: data
    });
  };

  /**
   * call an external api specified as {url:<url>} in params
   */
  this.getExternalUrl = function (headers, params) {
    return http.request({
      url: '/ext',
      method: 'GET',
      headers: headers,
      urlBase: urlBasePath + '/ml_ext', // note, used to override the '/ml' in server_request_service.js
      params: params
    });
  };

  /**
   * post data to an external url
   */
  this.postExternalUrl = function (headers, url, data) {
    return http.request({
      url: '/ext',
      method: 'POST',
      headers: headers,
      urlBase: urlBasePath + '/ml_ext', // note, used to override the '/ml' in server_request_service.js
      params: {url:url},
      data: data
    });
  };

  /**
   * start or stop a scheduled job
   */
  this.schedulerControl = function (jobId, instruction, params) {
    return http.request({
      url: '/schedulers/' + jobId + '/' + instruction,
      method: 'POST',
      data: '',
      params: params
    });
  };

  /**
   * validate a detector
   */
  this.validateDetector = function (data) {
    return http.request({
      url: '/validate/detector/',
      method: 'POST',
      data: data
    });
  };

  /**
   * validate an array of transforms
   */
  this.validateTransforms = function (data) {
    return http.request({
      url: '/validate/transforms/',
      method: 'POST',
      data: data
    });
  };

  /**
   * get the Enigne's status document
   */
  this.status = function () {
    return http.request({
      url: '/status',
      method: 'GET'
    });
  };

});

