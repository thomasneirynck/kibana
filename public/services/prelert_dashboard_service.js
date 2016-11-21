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

// Service with functions used across Prelert dashboards, such as broadcasting
// and listening for events.
import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlDashboardService', [ '$rootScope', function($rootScope) {

  // Broadcasts that a change has been made to the selected jobs.
  this.broadcastJobSelectionChange = function(selectedJobIds) {
    $rootScope.$broadcast('jobSelectionChange', selectedJobIds);
  };

  // Add a listener for changes to the selected jobs.
  this.listenJobSelectionChange = function(scope, callback) {
    var handler = $rootScope.$on('jobSelectionChange', callback);
    scope.$on('$destroy', handler);
  };

}]);
