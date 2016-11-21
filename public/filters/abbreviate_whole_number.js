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
 * AngularJS filter to abbreviate large whole numbers with metric prefixes.
 * Uses numeral.js to format numbers longer than the specified number of
 * digits with metric abbreviations e.g. 12345 as 12k, or 98000000 as 98m.
*/
import numeral from 'numeral';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.filter('abbreviateWholeNumber', function () {
  return function (value, maxDigits) {
    var maxNumDigits = (maxDigits !== undefined ? maxDigits : 3);
    if (Math.abs(value) < Math.pow(10, maxNumDigits)) {
      return value;
    } else {
      return numeral(value).format("0a");
    }
  };
});

