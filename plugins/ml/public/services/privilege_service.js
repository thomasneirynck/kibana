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

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlPrivilegeService', function (Promise, ml) {

  this.getJobManagementPrivileges = function () {
    const privileges = {
      canCreateJob: false,
      canDeleteJob: false,
      canStartStopDatafeed: false,
    };

    return new Promise((resolve, reject) => {
      const priv = {
        cluster: [
          'cluster:admin/ml/job/put',
          'cluster:admin/ml/job/delete',
          'cluster:admin/ml/datafeeds/put',
          'cluster:admin/ml/datafeeds/delete',
          'cluster:admin/ml/datafeeds/start',
          'cluster:admin/ml/datafeeds/stop'
        ]
      };

      ml.checkPrivilege(priv)
      .then((resp) => {
        if (resp.cluster['cluster:admin/ml/job/put'] &&
            resp.cluster['cluster:admin/ml/datafeeds/put']) {
          privileges.canCreateJob = true;
        }

        if (resp.cluster['cluster:admin/ml/job/delete'] &&
            resp.cluster['cluster:admin/ml/datafeeds/delete']) {
          privileges.canDeleteJob = true;
        }

        if (resp.cluster['cluster:admin/ml/datafeeds/start'] &&
            resp.cluster['cluster:admin/ml/datafeeds/stop']) {
          privileges.canStartStopDatafeed = true;
        }
        return resolve(privileges);
      })
      .catch(() => {
        return reject(privileges);
      });
    });
  };
});
