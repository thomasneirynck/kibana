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

import _ from 'lodash';
import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.controller('PrlTransformModal', function ($scope, $modalInstance, params, prlJobService, prlMessageBarService) {
  const msgs = prlMessageBarService;
  msgs.clear();
  $scope.title = 'Add new transform';
  $scope.transform = {};
  $scope.saveLock = false;
  $scope.editMode = false;
  let index = -1;
  $scope.urlBasePath = chrome.getBasePath();

  $scope.ui = {
    types: [
      {id: 'domain_split',  uri: 'domain_split.html', minInputs:1, minOutputs:2 },
      {id: 'concat',        uri: 'concat.html',       minInputs:2, minOutputs:1 },
      {id: 'exclude',       uri: 'exclude.html',      minInputs:1, minOutputs:1 },
      {id: 'extract',       uri: 'extract.html',      minInputs:1, minOutputs:1 },
      {id: 'split',         uri: 'split.html',        minInputs:1, minOutputs:1 },
      {id: 'trim',          uri: 'trim.html',         minInputs:1, minOutputs:1 },
      {id: 'lowercase',     uri: 'lowercase.html',    minInputs:1, minOutputs:1 },
      {id: 'uppercase',     uri: 'uppercase.html',    minInputs:1, minOutputs:1 },
      {id: 'geo_unhash',    uri: 'geo_unhash.html',   minInputs:1, minOutputs:1 }
    ],
    conditions: [
      {title:'equal to',                 value:'EQ'},
      {title:'greater than',             value:'GT'},
      {title:'greater than or equal to', value:'GTE'},
      {title:'less than',                value:'LT'},
      {title:'less than or equal to',    value:'LTE'},
      {title:'match',                    value:'MATCH'}
    ],
    getTransform: function (typeId) {
      return _.findWhere($scope.ui.types, {id: typeId});
    }
  };

  $scope.typeId = $scope.ui.types[0].id;
  $scope.DEFAULT_OUTPUTS = params.DEFAULT_OUTPUTS;

  $scope.properties = params.properties;
  $scope.helpLink = {};

  const dataFormat = params.dataFormat;

  const validate = params.validate;
  const add = params.add;

  function init() {
    // edit mode
    if (params.transform) {
      $scope.transform = params.transform;
      // add possibly missing non-required fields
      addNonRequiredFields($scope.transform);

      index = params.index;
      $scope.title = 'Edit transform';
      $scope.editMode = true;
      $scope.typeId = $scope.transform.transform;
    } else {
      // new mode, create a new empty transform
      $scope.transformChange($scope.typeId);
    }
  }

  // create a new transform
  $scope.transformChange = function (typeId) {
    switch (typeId) {
      case 'domain_split' :
        $scope.transform = {transform: 'domain_split', inputs: [''], outputs:['','']};
        break;
      case 'concat' :
        $scope.transform = {transform: 'concat', inputs: ['',''], outputs: [''], arguments: ['']};
        break;
      case 'exclude' :
        $scope.transform = {transform: 'exclude', inputs: [''], condition: {operator: '', value:''}};
        break;
      case 'extract' :
        $scope.transform = {transform: 'extract', inputs: [''], outputs: [''], arguments: ['']};
        break;
      case 'split' :
        $scope.transform = {transform: 'split', inputs: [''], outputs: [''], arguments: ['']};
        break;
      case 'trim' :
        $scope.transform = {transform: 'trim', inputs: [''], outputs: ['']};
        break;
      case 'lowercase' :
        $scope.transform = {transform: 'lowercase', inputs: [''], outputs: ['']};
        break;
      case 'uppercase' :
        $scope.transform = {transform: 'uppercase', inputs: [''], outputs: ['']};
        break;
      case 'geo_unhash' :
        $scope.transform = {transform: 'geo_unhash', inputs: [''], outputs: ['']};
        break;
    }

    // 'raw' is a special key word, for use with single_line files that do not contain headers.
    if (dataFormat === 'SINGLE_LINE' && typeId === 'extract') {
      $scope.transform.inputs[0] = 'raw';
    }

    const trans = $scope.ui.getTransform(typeId);
    $scope.helpLink.uri = 'transforms/';
    $scope.helpLink.label = 'Help for ';

    if (trans) {
      $scope.helpLink.uri += trans.uri;
      $scope.helpLink.label += trans.id;
    } else {
      $scope.helpLink.uri += 'transforms.html';
      $scope.helpLink.label += 'transforms';
    }
  };

  // add possibly missing non-required fields when editing a transform
  function addNonRequiredFields(trfm) {
    switch (trfm.transform) {
      case 'domain_split' :
        if (trfm.outputs === undefined) {
          trfm.outputs = ['',''];
        }
        break;
      case 'concat' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        if (trfm.arguments === undefined) {
          trfm.arguments = [''];
        }
        break;
      case 'extract' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
      case 'split' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
      case 'trim' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
      case 'lowercase' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
      case 'uppercase' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
      case 'geo_unhash' :
        if (trfm.outputs === undefined) {
          trfm.outputs = [''];
        }
        break;
    }
  }

  // remove non required fields if they are blank
  function removeNonRequiredFields(trfm) {
    switch (trfm.transform) {
      case 'domain_split' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '' && trfm.outputs[1].trim() === '')) {
          delete trfm.outputs;
        }
        break;
      case 'concat' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        if (trfm.arguments !== undefined && (trfm.arguments[0].trim() === '')) {
          delete trfm.arguments;
        }
        break;
      case 'extract' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        break;
      case 'split' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) { // this should loop over outputs
          delete trfm.outputs;
        }
        break;
      case 'trim' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        break;
      case 'lowercase' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        break;
      case 'uppercase' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        break;
      case 'geo_unhash' :
        if (trfm.outputs !== undefined && (trfm.outputs[0].trim() === '')) {
          delete trfm.outputs;
        }
        break;
    }
  }

  $scope.save = function () {

    removeNonRequiredFields($scope.transform);

    $scope.saveLock = true;
    validate($scope.transform, index)
      .then((resp) => {
        $scope.saveLock = false;
        if (resp.success) {
          add($scope.transform, index);
          $modalInstance.close($scope.transform);
          msgs.clear();
        } else {
          $scope.saveLock = false;
          msgs.error(resp.message);
          // save failed, so re-add any empty fields which might have been stripped
          addNonRequiredFields($scope.transform);
        }
      });
  };

  $scope.cancel = function () {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };

  $scope.removeInput = function (index) {
    $scope.transform.inputs.splice(index, 1);
  };

  $scope.removeOutput = function (index) {
    $scope.transform.outputs.splice(index, 1);
  };

  init();
});
