/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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

import { VALIDATION_STATUS } from '../constants/validation';

// get the most severe status level from a list of messages
const contains = (arr, str) => arr.findIndex(v => v === str) >= 0;
export function getMostSevereMessageStatus(messages) {
  const statuses = messages.map(m => m.status);
  return [
    VALIDATION_STATUS.INFO,
    VALIDATION_STATUS.WARNING,
    VALIDATION_STATUS.ERROR
  ].reduce((previous, current) => {
    return contains(statuses, current) ? current : previous;
  }, VALIDATION_STATUS.SUCCESS);
}

// extends an angular directive's scope with the necessary methods
// needed to embed the job validation button
export function addJobValidationMethods($scope, service) {
  $scope.getDuration = () => ({
    start: $scope.formConfig.start,
    end: $scope.formConfig.end
  });

  // isCurrentJobConfig is used to track if the form configuration
  // changed since the last job validation was done
  $scope.isCurrentJobConfig = false;
  // need to pass true as third argument here to track granular changes
  $scope.$watch('formConfig', () => { $scope.isCurrentJobConfig = false; }, true);
  $scope.getJobConfig = () => {
    $scope.isCurrentJobConfig = true;
    return service.getJobFromConfig($scope.formConfig);
  };
}
