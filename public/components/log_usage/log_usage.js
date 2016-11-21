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

import _ from 'lodash';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

// Directive which sends basic usage information on the Prelert Engine API
// dashboards to Prelert, specifically the API product and version number,
// server platform and OS version, customer ID, dashboard title, action and time.
module.directive('prlLogUsage', function(prlInfoService) {
  return {
    restrict: 'E',

    link: function(scope, element, attrs) {
      var info = {};
      // Send the name of view, plus an optional actionID parameter, which is used
      // for example on the Jobs page to indicate create, edit, delete etc.
      info['view'] = _.get(attrs, 'view', '');
      if (_.has(attrs, 'actionid')) {
        info['actionID'] = attrs['actionid'];
      }
      prlInfoService.logUsageInfo(info);
    }

  };

});
