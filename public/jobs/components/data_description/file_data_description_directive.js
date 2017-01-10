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


import moment from 'moment-timezone';
import _ from 'lodash';
import $ from 'jquery';
import stringUtils from 'plugins/ml/util/string_utils';
import angular from 'angular';
import 'plugins/ml/lib/bower_components/jquery-csv/src/jquery.csv';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/ml');

module.directive('mlFileDataDescription', function ($http) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      properties:      '=mlProperties',
      data:            '=mlUploadedData',
      dataPreview:     '=mlUploadedDataPreview',
      fileName:        '=mlUploadedDataFileName',
      dataReady:       '=mlDataReady',
      delimiter:       '=mlSelectedFieldDelimiter',
      data_description: '=mlDataDescription',
      influencers:     '=mlInfluencers',
      maximumFileSize: '=mlMaximumFileSize',
    },
    template: require('plugins/ml/jobs/components/data_description/file_data_description.html'),
    controller: function ($scope, $q, mlJobService, mlMessageBarService) {
      const msgs = mlMessageBarService; // set a reference to the message bar service
      $scope.CHAR_LIMIT = 500;
      $scope.saveLock = false;

      $scope.delimiterGuessed = false;
      $scope.typesGuessed = false;
      $scope.timeFormatGuessed = false;
      $scope.forceDataReady = false; // temp setting until JSON parsing is done

      $scope.ui = {
        properties: {},
        customFieldDelimiter: '',
        inputDataFormat:[
          { value: 'DELIMITED',     title: 'Delimited' },
          { value: 'JSON',          title: 'JSON' },
          { value: 'SINGLE_LINE',   title: 'Single Line' },
          // { value: 'ELASTICSEARCH', title: 'Elasticsearch' },
        ],
        fieldDelimiterOptions:[
          { value: '\t',      title: 'tab'},
          { value: ' ',       title: 'space'},
          { value: ',',       title: ','},
          { value: ';',       title: ';'},
          { value: '|',       title: '|'},
          { value: '.',       title: '.'},
          { value: 'custom',  title: 'custom'},
        ],
        friendlyFieldDelimiter: function (val) {
          return _.findWhere(this.fieldDelimiterOptions, {value: val}).title;
        },
        delimiters: [',', '\t', ' ', '.', '|'],
      };

      $scope.uploadData = {
        fileUploaded: '',
        fileName:     '',
        data:         '',
        dataPreview:  '',
      };

      $scope.exampleTime = '';
      $scope.firstLine = '';
      $scope.delimiters = [];

      function resetData() {
        $scope.data_description.format = 'DELIMITED';
        $scope.data_description.field_delimiter = '';
        $scope.data_description.time_field = '';
        $scope.data_description.time_format = '';
        $scope.data_description.quote_character = '"';
        $scope.firstLine = '';

        $scope.ui.properties = {};
        $scope.properties = {};
        checkDataReady();
      }

      function resetButton() {
        $scope.saveLock = false;
        $scope.buttonText = 'Import';
      }

      $scope.readSuccessCallback = function () {
        resetData();
        $scope.dataReady = false;

        $scope.data = $scope.uploadData.data;
        $scope.dataPreview = $scope.uploadData.dataPreview;
        $scope.fileName = $scope.uploadData.fileName;

        guessDataFormat();
        $scope.dataFormatChange();
      };

      function checkDataReady() {
        if ($scope.data_description.format === 'DELIMITED' ||
           $scope.data_description.format === 'JSON') {
          $scope.dataReady = (($scope.delimiterGuessed &&
            $scope.typesGuessed &&
            $scope.timeFormatGuessed) || $scope.forceDataReady);
        } else {
          // single line format, no fields or settings guessed
          $scope.dataReady = true;
        }
      }

      $scope.dataFormatChange = function () {
        if ($scope.data_description.format === 'DELIMITED') {
          findFirstLine();
          guessDelimiters();
        }
        guessFields();
        guessTimeField();
        guessTimeFormat();

        checkDataReady();
      };

      function guessDataFormat() {
        if ($scope.uploadData.fileName.match('.csv')) {
          $scope.data_description.format = 'DELIMITED';
        } else if ($scope.uploadData.fileName.match('.json')) {
          $scope.data_description.format = 'JSON';
          $scope.forceDataReady = true;
        } else {
          // make a crude guess at the contents by looking at the first
          // character of the file.
          if ($scope.uploadData.data[0] === '{' ||
             $scope.uploadData.data[0] === '[') {
            $scope.data_description.format = 'JSON';
            $scope.forceDataReady = true;
          }
        }
        console.log('guessDataFormat: guessed data format: ' + $scope.data_description.format);

      }

      function findFirstLine() {
        const lines = $scope.uploadData.data.match(/^.*/);
        if (lines.length) {
          $scope.firstLine = lines[0];
        }
      }

      function guessDelimiters() {
        $scope.delimiters = stringUtils.guessDelimiters($scope.firstLine, $scope.ui.delimiters);
        if ($scope.delimiters.length) {
          $scope.delimiter = $scope.delimiters[0];
          $scope.delimiterGuessed = true;
          console.log('guessDelimiters: guessed delimiter: ' + $scope.delimiter);
        }
      }

      function guessFields() {
        if ($scope.data_description.format === 'DELIMITED' && $scope.delimiter) {
          $scope.ui.properties = {};
          $scope.properties = {};
          const properties = $scope.firstLine.split($scope.delimiter);
          const reg = new RegExp($scope.data_description.quote_character, 'g');
          _.each(properties, (f) => {
            f = f.replace(reg, '');
            $scope.ui.properties[f] = f;
            $scope.properties[f] = f;
          });
          console.log('guessFields: guessed delimited fields: ', $scope.properties);
          $scope.influencers = Object.keys($scope.properties);
          $scope.typesGuessed = true;
        } else if ($scope.data_description.format === 'JSON') {
          let json;
          try {
            json = angular.fromJson($scope.uploadData.data);
            // parsed file is an array of objects.
            // take the first one
            if (Array.isArray(json) && json.length) {
              json = json[0];
            }
          } catch (e) {
            console.log('guessFields: could not parse JSON. Splitting on newlines and attempting again.');
            try {
              // the file might be a collection of json objects delimited by newlines
              findFirstLine();
              json = angular.fromJson($scope.firstLine);

            } catch (e) {
              console.log('guessFields: still could not parse JSON.');
            }
          }

          if (json && typeof json === 'object') {
            // using the first item in the json object. take the names as the properties
            angular.copy(json, $scope.properties);
            angular.copy(json, $scope.ui.properties);
            $scope.influencers = Object.keys($scope.properties);
            $scope.typesGuessed = true;

            console.log('guessFields: JSON parsed successfully');
          }
        } else {
          // single line format, no fields can be guessed
          $scope.ui.properties = {};
          $scope.properties = {};
          $scope.influencers = [];
          $scope.typesGuessed = false;
        }
      }
      // add a reference to the scope to allow the html to use it
      $scope.guessFields = guessFields;

      function guessTimeField() {
        let match = $scope.data_description.time_field;
        _.each($scope.properties, (prop, i) => {
          // loop through properties and find the first item that matches 'time'
          if (match === '' && i.match('time')) {
            match = i;
          }
        });
        if (match !== '') {
          $scope.data_description.time_field = match;
          console.log('guessTimeField: guessed time fields: ', match);
        }
      }

      function guessTimeFormat() {
        if ($scope.data_description.time_field !== '') {
          $scope.data_description.time_format = '';

          const testData = $scope.uploadData.data;
          const quo = $scope.data_description.quote_character;

          const jqueryCsvOptions = {
            separator: $scope.delimiter,
            delimiter: $scope.data_description.quote_character,
            state: {}
          };

          if ($scope.data_description.format === 'DELIMITED') {
            try {
              let lines = testData.split('\n');
              // better splitter, but crashes the page in chrome for some large csv files
              // let lines = $.csv.parsers.splitLines(testData, jqueryCsvOptions);

              // discard the rest of the array
              lines = lines.slice(0, 2);

              // index of the time column
              let colIndex;
              if (lines[0].trim() === $scope.firstLine.trim()) {
                // find the selected time column
                const cols = $.csv.toArray($scope.firstLine, jqueryCsvOptions);
                const quoReg = new RegExp(quo, 'g');
                _.each(cols, (col, i) => {
                  col = col.replace(quoReg, '');
                  if (col === $scope.data_description.time_field) {
                    colIndex = i;
                  }
                });
                // remove the header line
                lines.shift();
              }

              let guessed = false;
              if (colIndex !== undefined && lines.length) {
                const line = lines[0];

                // split the line by delimiter, igonoring delimiters inside quotes
                const cols = $.csv.toArray(line, jqueryCsvOptions);
                const col = cols[colIndex];

                $scope.data_description.time_format = stringUtils.guessTimeFormat(col);
                $scope.timeFormatGuessed = true;
              }
            } catch (e) {
              console.log('guessTimeFormat: error spliting file up by delimiter', e);
            }
          } else if ($scope.data_description.format === 'JSON') {
            // because of the way the properties were detected in guessFields().
            // $scope.properties[$scope.data_description.time_field] contains real data
            // which can be used to detect the time format.
            const tf = $scope.properties[$scope.data_description.time_field];
            $scope.data_description.time_format = stringUtils.guessTimeFormat(tf);
            if ($scope.data_description.time_format) {
              $scope.timeFormatGuessed = true;
            }
          }
        }
        checkDataReady();
        $scope.getExampleTime();
      }
      // add a reference to the scope to allow the html to use it
      $scope.guessTimeFormat = guessTimeFormat;


      $scope.toggleTypes = function (key, index) {
        const idx = $scope.properties[key];
        if (idx === undefined) {
          $scope.properties[key] = index;
          guessTimeField();
          guessTimeFormat();
        } else {
          delete $scope.properties[key];
        }
        // console.log($scope.properties);
      };

      $scope.getExampleTime = function () {
        $scope.exampleTime = stringUtils.generateExampleTime($scope.data_description.time_format);
      };

    }
  };
});

