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

import uiRoutes from 'ui/routes';
import chrome from 'ui/chrome';
import _ from 'lodash';
import moment from 'moment-timezone';
import filesaver from '@spalger/filesaver';
let saveAs = filesaver.saveAs

import stringUtils from 'plugins/prelert/util/string_utils';

uiRoutes
.when('/support/?', {
  template: require('./support.html')
});

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlSupport', function ($scope, $http, es, kbnVersion, timefilter, prelertAPIServices, prlInfoService, prlBrowserDetectService, prlMessageBarService) {
  var apiService = prelertAPIServices();
  timefilter.enabled = false; // remove time picker from top of page
  var msgs = prlMessageBarService; // set a reference to the message bar service
  msgs.clear();

  $scope.kbnVersion = kbnVersion;

  $scope.supportBundleEnabled = (prlBrowserDetectService() !== "safari");

  function getESVersion() {
    var host = "http://localhost:5601/elasticsearch";
    if(es.transport && es.transport._config && es.transport._config.host) {
      host = es.transport._config.host;
    }
    apiService.JobsService.getExternalUrl({}, {url: host})
      .then(function(resp) {
        if(resp && resp.version) {
          $scope.esVersion = resp.version.number;
        }
      });
  }

  function getEngineApiVersion() {
    prlInfoService.getEngineInfo()
      .then(function(resp) {
        if (resp && resp.info) {
          $scope.analyticsVersion = resp.info.ver;
          $scope.apiVersion = resp.info.appVer;
        }
      });
  }

  // load the support bundle using proxy to the engine api
  $scope.getSupportBundle = function() {
    msgs.clear();

    $http.get(chrome.getBasePath() + '/prelert_support/', {
      responseType: 'arraybuffer'
    })
    .then(function(resp){
      // zip file is returned as binary data
      // put it in a Blob and then prompt the browser to save it as a file.
      if(resp && resp.data) {
        var data = resp.data;
        var blob = new Blob([ data ], { type : 'application/octet-stream' });
        saveAs(blob, "prelert_support_bundle.zip");
      } else {
        msgs.error("Prelert support bundle could not be generated");
      }
    })
    .catch(function(resp) {
      msgs.error("Prelert support bundle could not be generated");
      if(resp && resp.message) {
        msgs.error(resp.message);
      }
    });
  };

  getESVersion();
  getEngineApiVersion();

  $scope.$emit('application.load');
});
