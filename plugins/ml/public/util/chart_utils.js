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

import { calculateTextWidth } from 'plugins/ml/util/string_utils';
import moment from 'moment';

const MAX_LABEL_WIDTH = 100;

export function numTicks(axisWidth) {
  return axisWidth / MAX_LABEL_WIDTH;
}

export function numTicksForDateFormat(axisWidth, dateFormat) {
  // Allow 1.75 times the width of a formatted date per tick for padding.
  const tickWidth = calculateTextWidth(moment().format(dateFormat), false);
  return axisWidth / (1.75 * tickWidth);
}
