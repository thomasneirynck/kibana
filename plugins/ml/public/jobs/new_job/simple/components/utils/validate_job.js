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

import { basicJobValidation } from 'plugins/ml/../common/util/job_utils';
import { newJobLimits } from 'plugins/ml/jobs/new_job/utils/new_job_defaults';
import _ from 'lodash';

export function validateJob(job, checks) {
  const limits = newJobLimits();
  const validationResults = basicJobValidation(job, undefined, limits);

  let valid = true;

  _.each(checks, (item) => {
    item.valid = true;
  });

  if (validationResults.contains('job_id_empty')) {
    checks.jobId.valid = false;
  } else if (validationResults.contains('job_id_invalid')) {
    checks.jobId.valid = false;
    let msg = 'Job name can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
    msg += 'must start and end with an alphanumeric character';
    checks.jobId.message = msg;
  }

  if (validationResults.contains('job_group_id_invalid')) {
    checks.groupIds.valid = false;
    let msg = 'Job group names can contain lowercase alphanumeric (a-z and 0-9), hyphens or underscores; ';
    msg += 'must start and end with an alphanumeric character';
    checks.groupIds.message = msg;
  }

  if (validationResults.contains('model_memory_limit_invalid')) {
    checks.modelMemoryLimit.valid = false;
    const msg = `Model memory limit cannot be higher than the maximum value of ${limits.max_model_memory_limit}`;
    checks.modelMemoryLimit.message = msg;
  }

  _.each(checks, (item) => {
    if (item.valid === false) {
      valid = false;
    }
  });

  return valid;
}
