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
 * AngularJS filter for formatting 'typical' and 'actual' values from Prelert API
 * Engine detectors which use the time_of_week or time_of_day functions. The filter
 * converts the raw number, which is the number of seconds since midnight, into a
 * human-readable form.
 */
import moment from 'moment';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.filter('timeOfWeek', function () {
  return function (text, fx) {
    if (fx === 'time_of_week') {
      const d = new Date();
      const i = parseInt(text);
      d.setTime(i * 1000);
      return moment(d).format('ddd hh:mm');
    } else if (fx === 'time_of_day') {
      const d = new Date();
      const i = parseInt(text);
      d.setTime(i * 1000);
      return moment(d).format('hh:mm');
    } else {
      return text;
    }
  };
});

