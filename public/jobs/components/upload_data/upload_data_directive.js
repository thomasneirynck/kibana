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
import JSZip from 'jszip';
import pako from 'pako';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlDataUpload', ['$http', function ($http) {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      job:                 '=prlJob',
      changeTab:           '=prlchangeTab',
      dataReady:           '=prlDataReady',
      showImport:          '=prlShowImport',
      uploadData:          '=prlUploadData',
      readSuccessCallback: '=prlReadSuccessCallback',
      maximumFileSize:     '=prlMaximumFileSize',
    },
    template: require('plugins/prelert/jobs/components/upload_data/upload_data.html'),
    controller: function ($scope, $q, $timeout, prlJobService, prlMessageBarService, prlBrowserDetectService) {
      const msgs = prlMessageBarService; // set a reference to the message bar service
      $scope.CHAR_LIMIT = 500;
      $scope.file = undefined;
      $scope.data = '';
      $scope.saveLock = false;

      $scope.uploadData = {
        fileUploaded: '',
        fileName:     '',
        data:         '',
        dataPreview:  '',
      };

      $scope.ui = {
        buttonText: 'Upload',
        saveStatus: {
          upload: 0
        },
        uploadPercentage: -1
      };

      // set maximum file upload size
      // chrome has a bug which causes it to crash when uploading a file around 120MB
      // so to be safe, set the limit to 100MB
      const MAX_FILE_SIZE_MB = (prlBrowserDetectService() === 'chrome') ? 100 : 200;
      $scope.maximumFileSize = MAX_FILE_SIZE_MB;
      const DATA_TYPE = {TEXT: 0, GZIP: 1, ZIP: 2};


      function clearFile() {
        $scope.data = '';
        $scope.dataPreview = '';
        $scope.file = undefined;
        $scope.dataReady = false;

        $scope.uploadData = {
          fileUploaded: '',
          fileName:     '',
          data:         '',
          dataPreview:  '',
        };
      }

      function resetButton() {
        $scope.saveLock = false;
        $scope.ui.buttonText = 'Upload';
      }

      // called when a file is selected using the file browser
      $scope.fileNameChanged = function (el) {
        clearFile();
        $scope.$apply(() => {
          if (el.files.length) {
            $scope.file = el.files[0];
            if ($scope.file.size <= (MAX_FILE_SIZE_MB * 1000000)) {
              msgs.clear();
              $scope.createFilePreview();
            } else {
              msgs.error('File reading error: file is over ' + MAX_FILE_SIZE_MB + 'MB');
            }
          } else {
            clearFile();
          }
        });
      };

      $scope.createFilePreview = function () {
        if ($scope.file !== undefined) {
          $scope.readFile()
          .then(function (file) {
            if (file.type === DATA_TYPE.TEXT) {
              $scope.uploadData.data = file.data;
            } else if (file.type === DATA_TYPE.ZIP) {
              const zip = new JSZip(file.data);
              let tempFile;
              // take the first file, ignore directories
              _.each(zip.files, function (f) {
                if (tempFile === undefined && !f.dir/* && f.name.match() */) {
                  tempFile = f.asText();
                  return;
                }
              });
              $scope.uploadData.data = tempFile;
            } else if (file.type === DATA_TYPE.GZIP) {
              $scope.uploadData.data  = pako.inflate(file.data, {to: 'string'});
            }
            $scope.uploadData.fileName = $scope.file.name;
            $scope.uploadData.dataPreview = $scope.uploadData.data.slice(0, $scope.CHAR_LIMIT) + '...';
            $scope.uploadData.fileUploaded = 1;
            if (!$scope.showImport) {
              if ($scope.readSuccessCallback !== undefined &&
                 $scope.uploadData.data !== '' &&
                 $scope.file && $scope.file.name) {
                $scope.readSuccessCallback();
              }
            }
          })
          .catch(function (e) {
            msgs.error('File reading error: file could not be read. It is possibly too large.');
            console.log('File reading error: ', e);
            clearFile();
            resetButton();
          });
        }
      };

      $scope.readFile = function () {
        const that = this;
        const deferred = $q.defer();
        that.saveLock = true;

        if (this.file && this.file.size) {
          const reader = new FileReader();
          let type = DATA_TYPE.TEXT;
          if (this.file.type && this.file.type.match('text')) {
            reader.readAsText(this.file);
          } else if (this.file.type && this.file.type.match('gzip')) {
            type = DATA_TYPE.GZIP;
            reader.readAsArrayBuffer(this.file);
          } else if (this.file.type && this.file.type.match('zip')) {
            type = DATA_TYPE.ZIP;
            reader.readAsArrayBuffer(this.file);
          } else {
            reader.readAsText(this.file);
          }

          reader.onload = (function () {
            return function (e) {
              that.saveLock = false;
              if (reader.result === '') {
                deferred.reject(reader.result);
              } else {
                deferred.resolve({data: reader.result, type: type});
              }
            };
          })(this.file);
        } else {
          deferred.reject();
        }
        return deferred.promise;
      };

      // used only by jobs list page
      // called when Import button is pressed in a job expanded row.
      $scope.uploadFile = function () {
        if (this.uploadData && this.uploadData.data) {
          const that = this;
          that.ui.uploadPercentage = -1;
          that.saveLock = true;
          that.ui.buttonText = 'Uploading...';

          that.ui.saveStatus.upload = 1;
          fileUploadProgress(that.job.id);

          if (this.uploadData.data) {
            prlJobService.uploadData(that.job.id, that.uploadData.data)
              .then(function (resp) {
                msgs.info(that.file.name + ' uploaded to ' + that.job.id);
                that.ui.saveStatus.upload = 2;
                that.ui.uploadPercentage = 100;

                // wait a second before refreshing to allow the progress bar to get to 100
                $timeout(function () {
                  clearFile();
                  resetButton();
                  // switch to counts tab
                  // this isn't needed, as the tab gets switched after the jobs list refreshes,
                  // but doing it here first makes it all appear smoother
                  if (that.changeTab) {
                    that.changeTab({index:3});
                  }
                  // refresh the selected job
                  prlJobService.refreshJob(that.job.id)
                    .then(function (job) {
                      // no need to do anything. the job service broadcasts a jobs list update event
                    })
                    .catch(function (job) {});
                }, 1000);
              })
              .catch(function (resp) {
                that.ui.saveStatus.upload = -1;
                that.ui.uploadPercentage = -1;

                if (resp.responses && resp.responses.length) {
                  msgs.error('Upload error: ' + resp.responses[0].error.message);
                } else if (resp.message) {
                  msgs.error('Upload error: ' + resp.message);
                } else {
                  msgs.error('Upload error: data could not be uploaded');
                }
                resetButton();
              });
          }
        }
      };
      // while data is being uploaded, load the processedRecordCount and work out
      // a progress percentage based on a guess of the records count in the file.
      function fileUploadProgress(jobId) {
        let trackFileUploadTimeout;
        let records = 0;
        const pollTime = 2; // seconds

        try {
          if ($scope.job.dataDescription.format === 'DELIMITED') {
            // assume each line is a record
            records = $scope.uploadData.data.split('\n').length;
            records = records - 2;
          } else if ($scope.job.dataDescription.format === 'JSON') {
            // if the json is an array, assume each element is a record
            if (Array.isArray($scope.uploadData.data)) {
              records = $scope.uploadData.data.length;
            } else {
              // assume each line is a separate json object and record
              records = $scope.uploadData.data.split('\n').length;
            }
          }

          const refresh = function () {
            prlJobService.loadJob(jobId)
            .then(function (resp) {
              if (resp && $scope.ui.saveStatus.upload !== -1) {
                $scope.ui.uploadPercentage = Math.round((resp.counts.processedRecordCount / records) * 100);
                if ($scope.ui.uploadPercentage <= 100) {
                  // console.log('fileUploadProgress():', $scope.ui.uploadPercentage);
                  if ($scope.ui.saveStatus.upload === 1) {
                    trackFileUploadTimeout = $timeout(refresh, (pollTime * 1000));
                  }
                } else {
                  // more than 100% ?
                  // just hide the progress bar
                  $scope.ui.uploadPercentage = -1;
                }
              }
            });
          };

          if (records > 0) {
            refresh();
          }
        } catch (e) {
          console.log('fileUploadProgress: progress bar failed to render ', e);
        }
      }
    }
  };
}]);

