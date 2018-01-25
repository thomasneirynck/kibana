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

import { validatePopulationAnalysis } from './validate_population_analysis';

export async function validateJob(callWithRequest, job) {
  try {
    const validationMessages = [
      ...await validatePopulationAnalysis(callWithRequest, job)
    ];

    return validationMessages.map(message => {
      if (typeof messages[message.id] !== 'undefined') {
        // render the message template with the provided metadata
        message.text = renderTemplate(messages[message.id].text, message);
        // check if the error message provides a link with further information
        // if so, add it to the message to be returned with it
        if (typeof messages[message.id].url !== 'undefined') {
          message.url = messages[message.id].url;
        }
      } else {
        message.text = `${message.id} (unknown message id)`;
      }

      return message;
    });
  } catch (error) {
    throw Boom.badRequest(error);
  }
}
