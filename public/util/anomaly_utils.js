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
 * Contains functions for operations commonly performed on anomaly data
 * to extract information for display in dashboards.
 */
define(function (require) {

  var _ = require('lodash');
  
  // List of function descriptions for which actual and display values from record level results should be displayed.
  var METRIC_DISPLAY_FUNCTIONS = ['count', 'distinct_count', 'lat_long', 'mean', 'max', 'min', 'sum', 'median', 'varp'];

  // Returns a severity label (one of critical, major, minor, warning or unknown)
  // for the supplied normalized anomaly score (a value between 0 and 100).
  function getSeverity(normalizedScore) {
    if (normalizedScore >= 75) {
      return "critical";
    } else if (normalizedScore >= 50) {
      return "major";
    } else if (normalizedScore >= 25) {
      return "minor";
    } else if (normalizedScore >= 0) {
      return "warning";
    } else {
      return "unknown";
    }
  }
  //Returns a severity RGB color (one of critical, major, minor, warning, low_warning or unknown)
  // for the supplied normalized anomaly score (a value between 0 and 100).
  function getSeverityColor(normalizedScore) {
    if (normalizedScore >= 75) {
      return "#fe5050";
    } else if (normalizedScore >= 50) {
      return "#fba740";
    } else if (normalizedScore >= 25) {
      return "#fbfb49";
    } else if (normalizedScore >= 3) {
      return "#8bc8fb";
    } else if (normalizedScore < 3) {
      return "#d2e9f7";
    } else {
      return "#FFFFFF";
    }
  }

  // Recurses through an object holding the list of detector descriptions against job IDs
  // checking for duplicate descriptions. For any detectors with duplicate descriptions, the
  // description is modified by appending the job ID in parentheses.
  // Only checks for duplicates across jobs; any duplicates within a job are left as-is.
  function labelDuplicateDetectorDescriptions(detectorsByJob) {
    var checkedJobIds = [];
    _.each(detectorsByJob, function(detectors, jobId){
      checkedJobIds.push(jobId);
      var otherJobs = _.omit(detectorsByJob, checkedJobIds);
      _.each(detectors, function(description, i){
        _.each(otherJobs, function(otherJobDetectors, otherJobId){
          _.each(otherJobDetectors, function(otherDescription, j){
            if (description === otherDescription) {
              detectors[i] = description + " (" + jobId + ")";
              otherJobDetectors[j] = description + " (" + otherJobId + ")";
            }
          });
        })
      });
    });

    return detectorsByJob;
  }

  // Returns the name of the field to use as the entity name from the source record
  // obtained from Elasticsearch. The function looks first for a byField, then overField,
  // then partitionField, returning undefined if none of these fields are present.
  function getEntityFieldName(record){
    // Analyses with by and over fields, will have a top-level byFieldName, but
    // the byFieldValue(s) will be in the nested causes array.
    if (_.has(record, 'byFieldName') && _.has(record, 'byFieldValue')) {
      return record['byFieldName'];
    }

    if (_.has(record, 'overFieldName')) {
      return record['overFieldName'];
    }

    if (_.has(record, 'partitionFieldName')) {
      return record['partitionFieldName'];
    }

    return undefined;
  }

  // Returns the value of the field to use as the entity value from the source record
  // obtained from Elasticsearch. The function looks first for a byField, then overField,
  // then partitionField, returning undefined if none of these fields are present.
  function getEntityFieldValue(record){
    if (_.has(record, 'byFieldValue')) {
      return record['byFieldValue'];
    }

    if (_.has(record, 'overFieldValue')) {
      return record['overFieldValue'];
    }

    if (_.has(record, 'partitionFieldValue')) {
      return record['partitionFieldValue'];
    }

    return undefined;
  }
  
  // Returns whether actual and typical metric values should be displayed for a record
  // with the specified function description.
  // Note that the 'function' field in a record contains what the user entered e.g. 'high_count',
  // whereas the 'functionDescription' field holds a Prelert-built display hint for function e.g. 'count'.
  function showMetricsForFunction(functionDescription) {
    return _.indexOf(METRIC_DISPLAY_FUNCTIONS, functionDescription) > -1;
  }

  return {
    getSeverity:  getSeverity,
    getSeverityColor: getSeverityColor,
    labelDuplicateDetectorDescriptions: labelDuplicateDetectorDescriptions,
    getEntityFieldName: getEntityFieldName,
    getEntityFieldValue: getEntityFieldValue,
    showMetricsForFunction: showMetricsForFunction
  };
});
