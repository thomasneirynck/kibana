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
 * AngularJS filter for formatting 'typical' and 'actual' values from Prelert API
 * Engine detectors which use the time_of_week or time_of_day functions. The filter
 * converts the raw number, which is the number of seconds since midnight, into a
 * human-readable form.
 */
import moment from 'moment';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.filter('timeOfWeek', function() {
  return function(text, fx) {
    if (fx == 'time_of_week') {
      var d = new Date();
      var i = parseInt(text);
      d.setTime(i * 1000);
      return moment(d).format('ddd hh:mm');
    } else if (fx == 'time_of_day') {
      var d = new Date();
      var i = parseInt(text);
      d.setTime(i * 1000);
      return moment(d).format('hh:mm');
    } else {
      return text;
    }
  };
});

