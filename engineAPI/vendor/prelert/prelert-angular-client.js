/*
 ************************************************************
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

/*
Angular.js service to the Prelert Anomaly Detective Engine API. This module can simply
be injected into your angular controllers.
*/
var module = angular.module('prelert.api.services', []);
 
module.factory('prelertAPIServices', ['$http', function ($http) {
    
    return function (config) {
        
        if (config !== Object(config)) {
            config = {baseURL: config};
        }
        
        // Set URL to default if it was not specified.
        if (config.baseURL == null) {
          config.baseURL = "http://"+window.location.hostname+":8080/engine/v1";
        }
        
        console.log("prelertAPIServices config: ");
        console.log(config);
        
        var prelertAPIServices = {};
        
        prelertAPIServices.JobsService = {
            urlBase: config.baseURL + "/jobs",
             
            /**
             * Supply skip and take params to obtain a specific page of results.
             */
            listJobs: function (params) {
                
                return $http.get(this.urlBase, {
                    params:params
                });
            },
            
            getJobDetails: function(jobId) {
                
            },
            
            setDescription: function(jobId, description) {
                // Need to set HTTP Content-Type header to text/plain.
                return $http.put(this.urlBase+'/'+jobId+'/description', description, {
                    headers: {
                        "Content-Type": "text/plain"
                    }
                });
            },
            
            deleteJob: function(jobId) {
                return $http.delete(this.urlBase+"/"+jobId);
            }
            
        };
        
        
        prelertAPIServices.ResultsService = {
                urlBase: config.baseURL + "/results",
                 
                /**
                 * Supply skip and take params to obtain a specific page of results.
                 */
                getResults: function(jobId, params) {
                    
                    return $http.get(this.urlBase+"/"+jobId, {
                        params:params
                    });
                },
                
                getBucketRecords: function(jobId, bucketId, params) {
                    return $http.get(this.urlBase+"/"+jobId +"/"+bucketId+"/records", {
                        params:params
                    });
                }
        };
        
        // TODO - maybe move inside ResultsService for simplicity?
        prelertAPIServices.RecordsService = {
                urlBase: config.baseURL + "/records",
                
                /**
                 * Queries the Prelert Engine API for the anomaly records for a job.
                 * Optional params that can be supplied:
                 *  - skip
                 *  - take
                 *  - start
                 *  - end
                 */
                getRecords: function(jobId, params) {
                    return $http.get(this.urlBase+"/"+jobId, {
                        params:params
                    });
                }
        };
        
        return prelertAPIServices;
    };
        
}]);