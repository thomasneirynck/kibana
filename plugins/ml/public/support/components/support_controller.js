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

import chrome from 'ui/chrome';
import filesaver from '@spalger/filesaver';
const saveAs = filesaver.saveAs;

import uiRoutes from 'ui/routes';
import checkLicense from 'plugins/ml/license/check_license';

uiRoutes
.when('/support/?', {
  template: require('./support.html'),
  resolve : {
    CheckLicense: checkLicense
  }
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlSupport',
function (
  $scope,
  $http,
  es,
  kbnVersion,
  timefilter,
  mlInfoService,
  mlBrowserDetectService,
  mlMessageBarService) {

  const msgs = mlMessageBarService; // set a reference to the message bar service
  timefilter.enabled = false; // remove time picker from top of page
  msgs.clear();

  $scope.kbnVersion = kbnVersion;

  $scope.supportBundleEnabled = (mlBrowserDetectService() !== 'safari');

  function getEngineApiVersion() {
    mlInfoService.getEngineInfo()
    .then((resp) => {
      if (resp && resp.info) {
        $scope.analyticsVersion = resp.info.ver;
        $scope.apiVersion = resp.info.appVer;
      }
    });
  }

  // load the support bundle using proxy to the engine api
  $scope.getSupportBundle = function () {
    msgs.clear();

    $http.get(chrome.getBasePath() + '/ml_support/', {
      responseType: 'arraybuffer'
    })
    .then((resp) =>{
      // zip file is returned as binary data
      // put it in a Blob and then prompt the browser to save it as a file.
      if (resp && resp.data) {
        const data = resp.data;
        const blob = new Blob([ data ], { type : 'application/octet-stream' });
        saveAs(blob, 'ml_support_bundle.zip');
      } else {
        msgs.error('Ml support bundle could not be generated');
      }
    })
    .catch((resp) => {
      msgs.error('Ml support bundle could not be generated');
      if (resp && resp.message) {
        msgs.error(resp.message);
      }
    });
  };

  getEngineApiVersion();

  $scope.$emit('application.load');
});
