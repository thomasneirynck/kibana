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

import Boom from 'boom';

import { renderTemplate } from '../../../common/util/string_utils';
import messages from './messages.json';
import { VALIDATION_STATUS } from '../../../common/constants/validation';

import { basicJobValidation } from '../../../common/util/job_utils';
import { validateBucketSpan } from './validate_bucket_span';
import { validateCardinality } from './validate_cardinality';
import { validateInfluencers } from './validate_influencers';


export async function validateJob(callWithRequest, payload) {
  try {
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Invalid payload: Needs to be an object.');
    }

    const { duration, fields, job } = payload;

    if (typeof job !== 'object') {
      throw new Error('Invalid job: Needs to be an object.');
    }

    if (typeof job.analysis_config !== 'object') {
      throw new Error('Invalid job.analysis_config: Needs to be an object.');
    }

    if (!Array.isArray(job.analysis_config.detectors)) {
      throw new Error('Invalid job.analysis_config.detectors: Needs to be an array.');
    }

    // check if basic tests pass the requirements to run the extended tests.
    // if so, run the extended tests and merge the messages.
    // otherwise just return the basic test messages.
    const basicValidation = basicJobValidation(job, fields);
    let validationMessages;

    if (basicValidation.valid) {
      // remove basic success messages from tests
      // where we run additional extended tests.
      const filteredBasicValidationMessages = basicValidation.messages.filter((m) => {
        return m.id !== 'bucket_span_valid';
      });

      validationMessages = [
        ...filteredBasicValidationMessages,
        ...await validateCardinality(callWithRequest, job),
        ...await validateBucketSpan(callWithRequest, job, duration),
        ...await validateInfluencers(callWithRequest, job)
      ];
    } else {
      validationMessages = basicValidation.messages;
      validationMessages.push({ id: 'skipped_extended_tests' });
    }

    return validationMessages.map(message => {
      if (typeof messages[message.id] !== 'undefined') {
        // render the message template with the provided metadata
        message.text = renderTemplate(messages[message.id].text, message);
        // check if the error message provides a link with further information
        // if so, add it to the message to be returned with it
        if (typeof messages[message.id].url !== 'undefined') {
          message.url = messages[message.id].url;
        }

        message.status = VALIDATION_STATUS[messages[message.id].status];
      } else {
        message.text = `${message.id} (unknown message id)`;
      }

      return message;
    });
  } catch (error) {
    throw Boom.badRequest(error);
  }
}
