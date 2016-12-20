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
* Contains functions for operations commonly performed on anomaly data
* to extract information for display in dashboards.
*/

const _ = require('lodash');

// List of function descriptions for which actual and display values from record level results should be displayed.
const METRIC_DISPLAY_FUNCTIONS = ['count', 'distinct_count', 'lat_long', 'mean', 'max', 'min', 'sum', 'median', 'letp'];

// Returns a severity label (one of critical, major, minor, warning or unknown)
// for the supplied normalized anomaly score (a value between 0 and 100).
function getSeverity(normalizedScore) {
  if (normalizedScore >= 75) {
    return 'critical';
  } else if (normalizedScore >= 50) {
    return 'major';
  } else if (normalizedScore >= 25) {
    return 'minor';
  } else if (normalizedScore >= 0) {
    return 'warning';
  } else {
    return 'unknown';
  }
}

// Returns a severity label (one of critical, major, minor, warning, low or unknown)
// for the supplied normalized anomaly score (a value between 0 and 100), where scores
// less than 3 are assigned a severity of 'low'.
function getSeverityWithLow(normalizedScore) {
  if (normalizedScore >= 75) {
    return 'critical';
  } else if (normalizedScore >= 50) {
    return 'major';
  } else if (normalizedScore >= 25) {
    return 'minor';
  } else if (normalizedScore >= 3) {
    return 'warning';
  } else if (normalizedScore >= 0) {
    return 'low';
  } else {
    return 'unknown';
  }
}

//Returns a severity RGB color (one of critical, major, minor, warning, low_warning or unknown)
// for the supplied normalized anomaly score (a value between 0 and 100).
function getSeverityColor(normalizedScore) {
  if (normalizedScore >= 75) {
    return '#fe5050';
  } else if (normalizedScore >= 50) {
    return '#fba740';
  } else if (normalizedScore >= 25) {
    return '#fbfb49';
  } else if (normalizedScore >= 3) {
    return '#8bc8fb';
  } else if (normalizedScore < 3) {
    return '#d2e9f7';
  } else {
    return '#FFFFFF';
  }
}

// Recurses through an object holding the list of detector descriptions against job IDs
// checking for duplicate descriptions. For any detectors with duplicate descriptions, the
// description is modified by appending the job ID in parentheses.
// Only checks for duplicates across jobs; any duplicates within a job are left as-is.
function labelDuplicateDetectorDescriptions(detectorsByJob) {
  const checkedJobIds = [];
  _.each(detectorsByJob, function (detectors, jobId) {
    checkedJobIds.push(jobId);
    const otherJobs = _.omit(detectorsByJob, checkedJobIds);
    _.each(detectors, function (description, i) {
      _.each(otherJobs, function (otherJobDetectors, otherJobId) {
        _.each(otherJobDetectors, function (otherDescription, j) {
          if (description === otherDescription) {
            detectors[i] = description + ' (' + jobId + ')';
            otherJobDetectors[j] = description + ' (' + otherJobId + ')';
          }
        });
      });
    });
  });

  return detectorsByJob;
}

// Returns the name of the field to use as the entity name from the source record
// obtained from Elasticsearch. The function looks first for a by_field, then over_field,
// then partition_field, returning undefined if none of these fields are present.
function getEntityFieldName(record) {
  // Analyses with by and over fields, will have a top-level by_field_name, but
  // the by_field_value(s) will be in the nested causes array.
  if (_.has(record, 'by_field_name') && _.has(record, 'by_field_value')) {
    return record.by_field_name;
  }

  if (_.has(record, 'over_field_name')) {
    return record.over_field_name;
  }

  if (_.has(record, 'partition_field_name')) {
    return record.partition_field_name;
  }

  return undefined;
}

// Returns the value of the field to use as the entity value from the source record
// obtained from Elasticsearch. The function looks first for a by_field, then over_field,
// then partition_field, returning undefined if none of these fields are present.
function getEntityFieldValue(record) {
  if (_.has(record, 'by_field_value')) {
    return record.by_field_value;
  }

  if (_.has(record, 'over_field_value')) {
    return record.over_field_value;
  }

  if (_.has(record, 'partition_field_value')) {
    return record.partition_field_value;
  }

  return undefined;
}

// Returns whether actual and typical metric values should be displayed for a record
// with the specified function description.
// Note that the 'function' field in a record contains what the user entered e.g. 'high_count',
// whereas the 'function_description' field holds a Prelert-built display hint for function e.g. 'count'.
function showMetricsForFunction(functionDescription) {
  return _.indexOf(METRIC_DISPLAY_FUNCTIONS, functionDescription) > -1;
}

export default {
  getSeverity:  getSeverity,
  getSeverityWithLow:  getSeverityWithLow,
  getSeverityColor: getSeverityColor,
  labelDuplicateDetectorDescriptions: labelDuplicateDetectorDescriptions,
  getEntityFieldName: getEntityFieldName,
  getEntityFieldValue: getEntityFieldValue,
  showMetricsForFunction: showMetricsForFunction
};
