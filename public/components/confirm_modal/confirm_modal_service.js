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

// service for interacting with the server
// used by prelert_angular_client.js

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.service('prlConfirmModalService', ['$modal', '$q',  function ($modal, $q) {

  this.open = function(options) {
    var deferred = $q.defer();
    var modalInstance = $modal.open({
      template: require('plugins/prelert/components/confirm_modal/confirm_modal.html'),
      controller: 'PrlConfirmModal',
      backdrop: "static",
      keyboard: false,
      size: (options.size === undefined)? "sm" : options.size,
      resolve: {
        params: function() {
          return {
            message:     options.message,
            title:       options.title,
            okLabel:     options.okLabel,
            cancelLabel: options.cancelLabel,
            hideCancel:  options.hideCancel,
            ok:          deferred.resolve,
            cancel:      deferred.reject,
          };
        }
      }
    });
    return deferred.promise;
  };
}]);

