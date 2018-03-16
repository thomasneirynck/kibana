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

import _ from 'lodash';
import moment from 'moment';
import dateMath from '@elastic/datemath';

// Assume interval is in the form (value)(unit), such as "1h"
const INTERVAL_STRING_RE = new RegExp('^([0-9\\.]*)\\s*(' + dateMath.units.join('|') + ')$');

export function parseInterval(interval, fallBackToOne = true) {
  const matches = String(interval).trim().match(INTERVAL_STRING_RE);
  if (!Array.isArray(matches)) return null;
  if (matches.length < 3) return null;

  try {
    const value = parseFloat(matches[1]) || ((fallBackToOne) ? 1 : 0);

    if (!fallBackToOne && value === 0) return null;

    const unit = matches[2];
    const duration = moment.duration(value, unit);

    // There is an error with moment, where if you have a fractional interval between 0 and 1, then when you add that
    // interval to an existing moment object, it will remain unchanged, which causes problems in the ordered_x_keys
    // code. To counteract this, we find the first unit that doesn't result in a value between 0 and 1.
    // For example, if you have '0.5d', then when calculating the x-axis series, we take the start date and begin
    // adding 0.5 days until we hit the end date. However, since there is a bug in moment, when you add 0.5 days to
    // the start date, you get the same exact date (instead of being ahead by 12 hours). So instead of returning
    // a duration corresponding to 0.5 hours, we return a duration corresponding to 12 hours.
    const selectedUnit = _.find(dateMath.units, function (_unit) {
      return Math.abs(duration.as(_unit)) >= 1;
    });

    return moment.duration(duration.as(selectedUnit), selectedUnit);
  } catch (e) {
    return null;
  }
}

// Parses an interval String, such as 7d, 1h or 30m to a moment duration.
// Differs from parseInterval in that it accepts zero length durations
// e.g. 0s, and allows fractional durations. Note that when adding or
// subtracting fractional durations, moment is only designed to work
// with units less than 'day'.
export function parseIntervalAcceptZero(str) {
  // TODO - combine this function with parseInterval().
  let interval = null;
  const matches = String(str).trim().match(INTERVAL_STRING_RE);
  if (matches) {
    try {
      const value = parseFloat(matches[1]);
      const unit = matches[2];

      interval = moment.duration(value, unit);
    } catch (e) {
      return null;
    }
  }

  return interval;
}
