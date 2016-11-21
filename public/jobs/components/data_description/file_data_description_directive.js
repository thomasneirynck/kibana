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

import moment from 'moment-timezone';
import _ from 'lodash';
import stringUtils from 'plugins/prelert/util/string_utils';
import 'plugins/prelert/lib/jquery.csv';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlFileDataDescription', ['$http', function($http) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      properties:      "=prlProperties",
      data:            "=prlUploadedData",
      dataPreview:     "=prlUploadedDataPreview",
      fileName:        "=prlUploadedDataFileName",
      dataReady:       "=prlDataReady",
      delimiter:       "=prlSelectedFieldDelimiter",
      dataDescription: "=prlDataDescription",
      influencers:     "=prlInfluencers",
      maximumFileSize: "=prlMaximumFileSize",
    },
    template: require('plugins/prelert/jobs/components/data_description/file_data_description.html'),
    controller: function($scope, $q, prlJobService, prlMessageBarService) {
      var msgs = prlMessageBarService; // set a reference to the message bar service
      $scope.CHAR_LIMIT = 500;
      $scope.saveLock = false;

      $scope.delimiterGuessed = false;
      $scope.typesGuessed = false;
      $scope.timeFormatGuessed = false;
      $scope.forceDataReady = false; // temp setting until JSON parsing is done

      $scope.ui = {
        properties: {},
        customFieldDelimiter: "",
        inputDataFormat:[
          { value: "DELIMITED",     title: "Delimited" },
          { value: "JSON",          title: "JSON" },
          { value: "SINGLE_LINE",   title: "Single Line" },
          // { value: "ELASTICSEARCH", title: "Elasticsearch" },
        ],
        fieldDelimiterOptions:[
          { value: "\t",      title: "tab"},
          { value: " ",       title: "space"},
          { value: ",",       title: ","},
          { value: ";",       title: ";"},
          { value: "|",       title: "|"},
          { value: ".",       title: "."},
          { value: "custom",  title: "custom"},
        ],
        friendlyFieldDelimiter: function(val) {
          return _.findWhere(this.fieldDelimiterOptions, {value: val}).title;
        },
        delimiters: [",", "\t", " ", ".", "|"],
      };

      $scope.uploadData = {
        fileUploaded: "",
        fileName:     "",
        data:         "",
        dataPreview:  "",
      };

      $scope.exampleTime = "";
      $scope.firstLine = "";
      $scope.delimiters = [];

      function resetData() {
        $scope.dataDescription.format = "DELIMITED";
        $scope.dataDescription.fieldDelimiter = "";
        $scope.dataDescription.timeField = "";
        $scope.dataDescription.timeFormat = "";
        $scope.dataDescription.quoteCharacter = "\"";
        $scope.firstLine = "";

        $scope.ui.properties = {};
        $scope.properties = {};
        checkDataReady();
      }

      function resetButton() {
        $scope.saveLock = false;
        $scope.buttonText = "Import";
      }

      $scope.readSuccessCallback = function() {
        resetData();
        $scope.dataReady = false;

        $scope.data = $scope.uploadData.data;
        $scope.dataPreview = $scope.uploadData.dataPreview;
        $scope.fileName = $scope.uploadData.fileName;

        guessDataFormat();
        $scope.dataFormatChange();
      };

      function checkDataReady() {
        if($scope.dataDescription.format === "DELIMITED" ||
           $scope.dataDescription.format === "JSON") {
          $scope.dataReady = (($scope.delimiterGuessed &&
                              $scope.typesGuessed &&
                              $scope.timeFormatGuessed) || $scope.forceDataReady );
        } else {
          // single line format, no fields or settings guessed
          $scope.dataReady = true;
        }
      }

      $scope.dataFormatChange = function() {
        if($scope.dataDescription.format === "DELIMITED") {
          findFirstLine();
          guessDelimiters();
        }
        guessFields();
        guessTimeField();
        guessTimeFormat();

        checkDataReady();
      };

      function guessDataFormat() {
        if($scope.uploadData.fileName.match(".csv")) {
          $scope.dataDescription.format = "DELIMITED";
        } else if($scope.uploadData.fileName.match(".json")) {
          $scope.dataDescription.format = "JSON";
          $scope.forceDataReady = true;
        } else {
          // make a crude guess at the contents by looking at the first
          // character of the file.
          if($scope.uploadData.data[0] === "{" ||
             $scope.uploadData.data[0] === "[") {
            $scope.dataDescription.format = "JSON";
            $scope.forceDataReady = true;
          }
        }
        console.log("guessDataFormat: guessed data format: "+$scope.dataDescription.format);

      }

      function findFirstLine() {
        var lines = $scope.uploadData.data.match(/^.*/);
        if(lines.length) {
          $scope.firstLine = lines[0];
        }
      }

      function guessDelimiters() {
        $scope.delimiters = stringUtils.guessDelimiters($scope.firstLine, $scope.ui.delimiters);
        if($scope.delimiters.length) {
          $scope.delimiter = $scope.delimiters[0];
          $scope.delimiterGuessed = true;
          console.log("guessDelimiters: guessed delimiter: "+$scope.delimiter);
        }
      }

      function guessFields() {
        if($scope.dataDescription.format === "DELIMITED" && $scope.delimiter) {
          $scope.ui.properties = {};
          $scope.properties = {};
          var properties = $scope.firstLine.split($scope.delimiter);
          var reg = new RegExp($scope.dataDescription.quoteCharacter, "g");
          _.each(properties, function(f){
            f = f.replace(reg, "");
            $scope.ui.properties[f] = f;
            $scope.properties[f] = f;
          });
          console.log("guessFields: guessed delimited fields: ", $scope.properties);
          $scope.influencers = Object.keys($scope.properties);
          $scope.typesGuessed = true;
        } else if ($scope.dataDescription.format === "JSON") {
          var json;
          try {
            json = angular.fromJson($scope.uploadData.data);
            // parsed file is an array of objects.
            // take the first one
            if(Array.isArray(json) && json.length) {
              json = json[0];
            }
          } catch(e) {
            console.log("guessFields: could not parse JSON. Splitting on newlines and attempting again.");
            try {
              // the file might be a collection of json objects delimited by newlines
              findFirstLine();
              json = angular.fromJson($scope.firstLine);

            } catch(e) {
              console.log("guessFields: still could not parse JSON.");
            }
          }

          if(json && typeof json === "object") {
            // using the first item in the json object. take the names as the properties
            angular.copy(json, $scope.properties);
            angular.copy(json, $scope.ui.properties);
            $scope.influencers = Object.keys($scope.properties);
            $scope.typesGuessed = true;

            console.log("guessFields: JSON parsed successfully");
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
        var match = $scope.dataDescription.timeField;
        _.each($scope.properties, function(prop, i) {
          // loop through properties and find the first item that matches "time"
          if(match === "" && i.match("time")) {
            match = i;
          }
        });
        if(match !== "") {
          $scope.dataDescription.timeField = match;
          console.log("guessTimeField: guessed time fields: ", match);
        }
      }

      function guessTimeFormat() {
        if($scope.dataDescription.timeField !== "") {
          $scope.dataDescription.timeFormat = "";

          var testData = $scope.uploadData.data ;
          var quo = $scope.dataDescription.quoteCharacter;

          var jqueryCsvOptions = {
            separator: $scope.delimiter,
            delimiter: $scope.dataDescription.quoteCharacter,
            state: {}
          };

          if($scope.dataDescription.format === "DELIMITED") {
            try {
              var lines = testData.split("\n");
              // better splitter, but crashes the page in chrome for some large csv files
              // var lines = $.csv.parsers.splitLines(testData, jqueryCsvOptions);

              // discard the rest of the array
              lines = lines.slice(0, 2);

              // index of the time column
              var colIndex;
              if(lines[0].trim() === $scope.firstLine.trim()) {
                // find the selected time column
                var cols = $.csv.toArray($scope.firstLine, jqueryCsvOptions);
                var quoReg = new RegExp(quo, "g");
                _.each(cols, function(col, i){
                  col = col.replace(quoReg, "");
                  if(col === $scope.dataDescription.timeField) {
                    colIndex = i;
                  }
                });
                // remove the header line
                lines.shift();
              }

              var guessed = false;
              if(colIndex !== undefined && lines.length) {
                var line = lines[0];

                // split the line by delimiter, igonoring delimiters inside quotes
                var cols = $.csv.toArray(line, jqueryCsvOptions);
                var col = cols[colIndex];

                $scope.dataDescription.timeFormat = stringUtils.guessTimeFormat(col);
                $scope.timeFormatGuessed = true;
                console.log("guessTimeFormat: guessed time format: ", $scope.dataDescription.timeFormat);
              }
            } catch(e) {
              console.log("guessTimeFormat: error spliting file up by delimiter", e);
            }
          } else if($scope.dataDescription.format === "JSON") {
            // because of the way the properties were detected in guessFields().
            // $scope.properties[$scope.dataDescription.timeField] contains real data
            // which can be used to detect the time format.
            var tf = $scope.properties[$scope.dataDescription.timeField];
            $scope.dataDescription.timeFormat = stringUtils.guessTimeFormat(tf);
            if($scope.dataDescription.timeFormat) {
              $scope.timeFormatGuessed = true;
              console.log("guessTimeFormat: guessed time format: ", $scope.dataDescription.timeFormat);
            }
          }
        }
        checkDataReady();
        $scope.getExampleTime();
      }
      // add a reference to the scope to allow the html to use it
      $scope.guessTimeFormat = guessTimeFormat;


      $scope.toggleTypes = function(key, index) {
        var idx = $scope.properties[key];
        if(idx === undefined) {
          $scope.properties[key] = index;
          guessTimeField();
          guessTimeFormat();
        } else {
          delete $scope.properties[key];
        }
        // console.log($scope.properties);
      };

      $scope.getExampleTime = function() {
        $scope.exampleTime = stringUtils.generateExampleTime($scope.dataDescription.timeFormat);
      };

    }
  };
}]);

