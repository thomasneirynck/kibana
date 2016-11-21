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

// Service for carrying out Elasticsearch queries to obtain data for the
// Prelert Results dashboards.
import _ from 'lodash';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlResultsService', ['$q', 'es', function ($q, es) {

    // Obtains the top influencer field values, by maximum anomaly score, for a
    // particular influencer index, field name and job ID(s).
    // Pass an empty array or ['*'] to search over all job IDs.
    // Returned response contains a results property, which is an array of objects
    // containing influencerFieldValue, maxAnomalyScore and sumAnomalyScore keys.
    this.getTopInfluencerValues = function(index, jobIds, influencerFieldName, earliestMs, latestMs, maxResults) {
      var deferred = $q.defer();
      var obj = {success: true, results: []};

      // Build the criteria to use in the bool filter part of the request.
      // Adds criteria for the time range plus any specified job IDs.
      var boolCriteria = [];
      boolCriteria.push({
        "range": {
          "@timestamp": {
            "gte": earliestMs,
            "lte": latestMs,
            "format": "epoch_millis"
          }
        }
      });
      if (jobIds && jobIds.length > 0 && !(jobIds.length == 1 && jobIds[0] == '*')) {
          var jobIdFilterStr = "";
          _.each(jobIds, function(jobId, i){
              if (i > 0) {
                  jobIdFilterStr += " OR ";
              }
              jobIdFilterStr += "jobId:";
              jobIdFilterStr += jobId;
          });
          boolCriteria.push({
            "query_string": {
              "analyze_wildcard":true,
              "query":jobIdFilterStr
            }
          });
      }

      es.search({
        index: index,
        size: 0,
        body: {
            "query": {
              "bool": {
                "filter": [
                  {
                    "query_string": {
                      "query": "_type:influencer AND influencerFieldName:"+influencerFieldName,
                      "analyze_wildcard": true
                    }
                  },
                  {
                    "bool": {
                      "must": boolCriteria
                    }
                  }
                ]
              }
            },
            "aggs": {
                "influencerFieldValues": {
                  "terms": {
                    "field": "influencerFieldValue",
                    "size": maxResults !== undefined ? maxResults : 2,
                    "order": {
                      "maxAnomalyScore": "desc"
                    }
                  },
                  "aggs": {
                    "maxAnomalyScore": {
                      "max": {
                        "field": "anomalyScore"
                      }
                    },
                    "sumAnomalyScore": {
                      "sum": {
                        "field": "anomalyScore"
                      }
                    }
                  }
                }
              }
          }
      })
      .then(function(resp) {
        var buckets = _.get(resp, ['aggregations', 'influencerFieldValues', 'buckets'], []);
        _.each(buckets, function(bucket){
            var result = {'influencerFieldValue': bucket.key,
                    'maxAnomalyScore': bucket.maxAnomalyScore.value,
                    'sumAnomalyScore': bucket.sumAnomalyScore.value};
            obj.results.push(result);
        });

        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };

    // Obtains the list of fields by which record level results may be viewed for all
    // the jobs that have been created. Essentially this is the list of unique 'by',
    // 'over' and 'partition' fields that have been defined across all the detectors for
    // a job, although for detectors with both 'by' and 'over' fields, the 'by' field name
    // is not returned since this field is not added to the top-level record fields.
    // Returned response contains a fieldsByJob property, with job ID keys
    // against an array of the field names by which record type results may be viewed
    // for that job.
    // Contains an addition '*' key which holds an array of the
    // unique fields across all jobs.
    this.getJobViewByFields = function(index) {
      var deferred = $q.defer();
      var obj = {success: true, fieldsByJob: {'*':[]}};

      es.search({
        index: index,
        size: 500,
        body: {
          "_source": ["id", "analysisConfig.detectors.*"],
          "query": {
            "bool" : {
              "filter" : [
                {"type" : { "value" : "job" }}
              ]
            }
          }
        }
      })
      .then(function(resp) {
        if (resp.hits.total !== 0) {

          _.each(resp.hits.hits, function(hit){
            // Add the list of distinct by, over and partition fields for each job.
            var fieldsForJob = [];
            var detectors = _.get(hit, '_source.analysisConfig.detectors', []);
            _.each(detectors, function(detector){
              if (_.has(detector, 'partitionFieldName')) {
                fieldsForJob.push(detector['partitionFieldName']);
              }
              if (_.has(detector, 'overFieldName')) {
                fieldsForJob.push(detector['overFieldName']);
              }
              // For jobs with by and over fields, don't add the 'by' field as this
              // field will only be added to the top-level fields for record type results
              // if it also an influencer over the bucket.
              if (_.has(detector, 'byFieldName') && !(_.has(detector, 'overFieldName'))) {
                fieldsForJob.push(detector['byFieldName']);
              }
            });

            obj.fieldsByJob[hit._id] = _.uniq(fieldsForJob);
            obj.fieldsByJob['*'] = _.union(obj.fieldsByJob['*'], obj.fieldsByJob[hit._id]);
          });

          // Sort fields alphabetically.
          _.each(obj.fieldsByJob, function(fields, jobId){
              obj.fieldsByJob[jobId] = _.sortBy(fields, function(field) {
                return field.toLowerCase();
              });
          });
        }
        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };


    // Obtains the categorization examples for the categories with the specified IDs
    // from the given index and job ID.
    // Returned response contains two properties - jobId and
    // examplesByCategoryId (list of examples against categoryId).
    this.getCategoryExamples = function(index, jobId, categoryIds, maxExamples) {
      var deferred = $q.defer();
      var obj = {success: true, jobId: jobId, examplesByCategoryId:{}};

      es.search({
        index: index,
        size: 500,  // Matches size of records in anomaly summary table.
        body: {
          "query": {
            "bool": {
              "filter": [
                {"term": {"_type": "categoryDefinition"}},
                {"term": {"jobId": jobId}},
                {"terms": {"categoryId": categoryIds}}
              ]
            }
          }
        }
      })
      .then(function(resp) {
        if (resp.hits.total !== 0) {
          _.each(resp.hits.hits, function(hit){
            if (maxExamples) {
              obj.examplesByCategoryId[hit._source.categoryId] =
                _.slice(hit._source.examples, 0, Math.min(hit._source.examples.length, maxExamples));
            } else {
              obj.examplesByCategoryId[hit._source.categoryId] = hit._source.examples;
            }

          });
        }
        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };


    // Queries Elasticsearch to obtain record level results containing the influencers
    // for the specified job(s), normalized probability threshold, and time range.
    // Pass an empty array or ['*'] to search over all job IDs.
    // Returned response contains a records property, with each record containing
    // only the fields jobId, detectorIndex, normalizedProbability and influencers.
    this.getRecordInfluencers = function(index, jobIds, threshold, earliestMs, latestMs, maxResults) {
      var deferred = $q.defer();
      var obj = {success: true, records: []};

      // Build the criteria to use in the bool filter part of the request.
      // Adds criteria for the existence of the nested influencers field, time range,
      // normalized probability, plus any specified job IDs.
      var boolCriteria = [];
      boolCriteria.push({
        "nested": {
          "path": "influencers",
          "query": {
            "bool": {
              "must": [
                {
                  "exists" : { "field" : "influencers" }
                }
              ]
            }
          }
        }
      });

      boolCriteria.push({
        "range": {
          "@timestamp": {
            "gte": earliestMs,
            "lte": latestMs,
            "format": "epoch_millis"
          }
        }
      });

      boolCriteria.push({
        "range": {
          "normalizedProbability": {
            "gte": threshold,
          }
        }
      });

      if (jobIds && jobIds.length > 0 && !(jobIds.length == 1 && jobIds[0] == '*')) {
        var jobIdFilterStr = "";
        _.each(jobIds, function(jobId, i){
          if (i > 0) {
            jobIdFilterStr += " OR ";
          }
          jobIdFilterStr += "jobId:";
          jobIdFilterStr += jobId;
        });
        boolCriteria.push({
          "query_string": {
            "analyze_wildcard":true,
            "query":jobIdFilterStr
          }
        });
      }

      es.search({
        index: index,
        size: maxResults !== undefined ? maxResults : 100,
        body: {
          "_source": ["jobId", "detectorIndex", "influencers", "normalizedProbability"],
          "query": {
            "bool": {
              "filter": [
                {
                  "query_string": {
                    "query": "_type:record",
                    "analyze_wildcard": true
                  }
                },
                {
                  "bool": {
                    "must": boolCriteria
                  }
                }
              ]
            }
          },
          "sort" : [
            { "normalizedProbability" : {"order" : "desc"}}
          ],
        }
      })
      .then(function(resp) {
        if (resp.hits.total !== 0) {
          _.each(resp.hits.hits, function(hit){
            obj.records.push(hit._source);
          });
        }
        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };


    // Queries Elasticsearch to obtain the record level results containing the specified influencer(s),
    // for the specified job(s), time range, and normalized probability threshold.
    // influencers parameter must be an array, with each object in the array having 'fieldName'
    // 'fieldValue' properties.
    // Pass an empty array or ['*'] to search over all job IDs.
    this.getRecordsForInfluencer = function(index, jobIds, influencers, threshold, earliestMs, latestMs, maxResults) {
      var deferred = $q.defer();
      var obj = {success: true, records: []};

      // Build the criteria to use in the bool filter part of the request.
      // Add criteria for the time range, normalized probability, plus any specified job IDs.
      var boolCriteria = [];
      boolCriteria.push({
        "range": {
          "@timestamp": {
            "gte": earliestMs,
            "lte": latestMs,
            "format": "epoch_millis"
          }
        }
      });

      boolCriteria.push({
        "range": {
          "normalizedProbability": {
            "gte": threshold,
          }
        }
      });

      if (jobIds && jobIds.length > 0 && !(jobIds.length == 1 && jobIds[0] == '*')) {
        var jobIdFilterStr = "";
        _.each(jobIds, function(jobId, i){
          if (i > 0) {
            jobIdFilterStr += " OR ";
          }
          jobIdFilterStr += "jobId:";
          jobIdFilterStr += jobId;
        });
        boolCriteria.push({
          "query_string": {
            "analyze_wildcard":true,
            "query":jobIdFilterStr
          }
        });
      }

      // Add a nested query to filter for each of the specified influencers.
      _.each(influencers, function(influencer){
        boolCriteria.push({
          "nested": {
            "path": "influencers",
            "query": {
              "bool": {
                "must": [
                  {
                    "match": {
                      "influencers.influencerFieldName": influencer.fieldName
                    }
                  },
                  {
                    "match": {
                      "influencers.influencerFieldValues": influencer.fieldValue
                    }
                  }
                ]
              }
            }
          }
        });
      });

      es.search({
        index: index,
        size: maxResults !== undefined ? maxResults : 100,
        body: {
          "query": {
            "bool": {
              "filter": [
                {
                  "query_string": {
                    "query": "_type:record",
                    "analyze_wildcard": true
                  }
                },
                {
                  "bool": {
                    "must": boolCriteria
                  }
                }
              ]
            }
          },
          "sort" : [
            { "normalizedProbability" : {"order" : "desc"}}
          ],
        }
      })
      .then(function(resp) {
        if (resp.hits.total !== 0) {
          _.each(resp.hits.hits, function(hit){
            obj.records.push(hit._source);
          });
        }
        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };


    // Queries Elasticsearch to obtain the record level results for the specified job and detector,
    // time range, normalized probability threshold, and whether to only return results containing influencers.
    // An additional, optional influencer field name and value may also be provided.
    this.getRecordsForDetector = function(index, jobId, detectorIndex, checkForInfluencers, influencerFieldName, influencerFieldValue, threshold, earliestMs, latestMs, maxResults) {
      var deferred = $q.defer();
      var obj = {success: true, records: []};

      // Build the criteria to use in the bool filter part of the request.
      // Add criteria for the time range, normalized probability, plus any specified job IDs.
      var boolCriteria = [];
      boolCriteria.push({
        "range": {
          "@timestamp": {
            "gte": earliestMs,
            "lte": latestMs,
            "format": "epoch_millis"
          }
        }
      });

      boolCriteria.push({ "term": { "jobId": jobId} });
      boolCriteria.push({ "term": { "detectorIndex": detectorIndex} });

      boolCriteria.push({
        "range": {
          "normalizedProbability": {
            "gte": threshold,
          }
        }
      });

      // Add a nested query to filter for the specified influencer field name and value.
      if (influencerFieldName && influencerFieldValue) {
        boolCriteria.push({
          "nested": {
            "path": "influencers",
            "query": {
              "bool": {
                "must": [
                  {
                    "match": {
                      "influencers.influencerFieldName": influencerFieldName
                    }
                  },
                  {
                    "match": {
                      "influencers.influencerFieldValues": influencerFieldValue
                    }
                  }
                ]
              }
            }
          }
        });
      } else {
        if (checkForInfluencers === true) {
          boolCriteria.push({
            "nested": {
              "path": "influencers",
              "query": {
                "bool": {
                  "must": [
                    {
                      "exists" : { "field" : "influencers" }
                    }
                  ]
                }
              }
            }
          });
        }
      }

      es.search({
        index: index,
        size: maxResults !== undefined ? maxResults : 100,
        body: {
          "query": {
            "bool": {
              "filter": [
                {
                  "query_string": {
                    "query": "_type:record",
                    "analyze_wildcard": true
                  }
                },
                {
                  "bool": {
                    "must": boolCriteria
                  }
                }
              ]
            }
          },
          "sort" : [
            { "normalizedProbability" : {"order" : "desc"}}
          ],
        }
      })
      .then(function(resp) {
        if (resp.hits.total !== 0) {
          _.each(resp.hits.hits, function(hit){
            obj.records.push(hit._source);
          });
        }
        deferred.resolve(obj);
      })
      .catch(function(resp) {
        deferred.reject(resp);
      });
      return deferred.promise;
    };

}]);
