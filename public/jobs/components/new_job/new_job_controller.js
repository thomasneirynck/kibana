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
import uiRoutes from 'ui/routes';
import 'plugins/prelert/jobs/components/new_job/detectors_list_directive';
import 'plugins/prelert/jobs/components/new_job/transforms_list';
import 'plugins/prelert/jobs/components/new_job/save_status_modal';
import 'plugins/prelert/lib/minify.json';
import 'plugins/prelert/lib/moment-jdateformatparser';
import 'ui/courier';

uiRoutes
.when('/jobs/new_job', {
  template: require('./new_job.html')
})
.when('/jobs/new_job/:jobId', {
  template: require('./new_job.html')
});

import moment from 'moment-timezone';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlNewJob', function ($scope, $route, $location, $modal, $timeout, courier, es, timefilter, prlJobService, prlMessageBarService, prlSchedulerService, prlConfirmModalService, prlTransformsDefaultOutputs) {

  timefilter.enabled = false; // remove time picker from top of page
  var MODE = {NEW: 0, EDIT: 1, CLONE: 2};
  var keyPressTimeout = null;
  // ui model, used to store and control job data that wont be posted to the server.
  var msgs = prlMessageBarService;
  var prlConfirm = prlConfirmModalService;
  msgs.clear();

  $scope.job = {};
  $scope.mode = MODE.NEW;
  $scope.saveLock = false;
  $scope.indices = {};
  $scope.types = {};
  $scope.properties = {};
  $scope.dateProperties = {};
  $scope.maximumFileSize ;
  $scope.prlElasticDataDescriptionExposedFunctions = {};
  $scope.elasticServerInfo = {};

  $scope.ui = {
    pageTitle: "Create a new job",
    wizard: {
      step:                 0,
      stepHovering:         0,
      CHAR_LIMIT:           500,
      fileUploaded:         0,
      fileName:             "",
      dataLocation:         "ES",
      indexInputType:       "TEXT",
      serverAuthenticated:  false,
      uploadedData:         "",
      dataPreview:          "",
      dataReady:            false,
      setDataLocation: function(loc) {
        $scope.ui.wizard.dataLocation = loc;
        wizardStep(1);
      },
      forward: function() {
        wizardStep(1);
      },
      back: function() {
        wizardStep(-1);
      },
    },
    currentTab: 0,
    tabs: [
      { index: 0, title: "Job Details" },
      { index: 1, title: "Transforms" },
      { index: 2, title: "Analysis Configuration" },
      { index: 3, title: "Data Description" },
      { index: 4, title: "Scheduler" },
      { index: 5, title: "Edit JSON" },
      { index: 6, title: "Data Preview", hidden: true },
    ],
    validation: {
      tabs: [
        {index: 0, valid: true, checks: { jobId: {valid: true}}},
        {index: 1, valid: true, checks: {}},
        {index: 2, valid: true, checks: { detectors: {valid: true}, influencers: {valid: true}, categorizationFilters: {valid: true} }},
        {index: 3, valid: true, checks: { timeField: {valid: true}, timeFormat: {valid:true} }},
        {index: 4, valid: true, checks: { isScheduled:{valid: true}}},
        {index: 5, valid: true, checks: {}},
        {index: 6, valid: true, checks: {}},
      ],
      serverAuthenticationError: "",
      setTabValid: function(tab, valid) {
        $scope.ui.validation.tabs[tab].valid = valid;
      }
    },
    jsonText: "",
    changeTab: changeTab,
    influencers: [],
    allInfluencers: allInfluencers,
    customInfluencers: [],
    transformInfluencers: [],
    tempCustomInfluencer: "",
    bucketSpanValues: [
      { value: 5,     title: "5 seconds" },
      { value: 10,    title: "10 seconds" },
      { value: 30,    title: "30 seconds" },
      { value: 60,    title: "1 minute" },
      { value: 300,   title: "5 minutes" },
      { value: 600 ,  title: "10 minutes" },
      { value: 1800,  title: "30 minutes" },
      { value: 3600,  title: "1 hour" },
      { value: 14400, title: "4 hours" },
      { value: 28800, title: "8 hours" },
      { value: 43200, title: "12 hours" },
      { value: 86400, title: "1 day" }
    ],
    inputDataFormat:[
      { value: "DELIMITED",     title: "Delimited" },
      { value: "JSON",          title: "JSON" },
      { value: "SINGLE_LINE",   title: "Single Line" },
      { value: "ELASTICSEARCH", title: "Elasticsearch" },
    ],
    fieldDelimiterOptions:[
      { value: "\t",      title: "tab"},
      { value: " ",       title: "space"},
      { value: ",",       title: ","},
      { value: ";",       title: ";"},
      { value: "custom",  title: "custom"}
    ],
    selectedFieldDelimiter: ",",
    customFieldDelimiter: "",
    esServerOk: 0,
    indexTextOk: false,
    indices: {},
    types: {},
    isScheduled: false,
    dataSources:[
      { value:"ELASTICSEARCH_2X", title:"Elasticsearch 2+", dataFormat:"ELASTICSEARCH" },
      { value:"ELASTICSEARCH_17X", title:"Elasticsearch 1.7.x", dataFormat:"ELASTICSEARCH" }
    ],
    scheduler: {
      dataSourceText:        "ELASTICSEARCH_2X",
      queryText:             '{"match_all":{}}',
      queryDelayText:        60,
      retrieveWholeSource:   true,
      frequencyText:         "",
      frequencyDefault:      "",
      scrollSizeText:        "",
      scrollSizeDefault:     1000,
      baseUrlText:           "",
      usernameText:          "",
      passwordText:          "",
      indicesText:           "",
      typesText:             "",
    },
    storedUrls: loadStoredBaseUrls(),
    postSaveUpload: true,
    saveStatus: {
      job:     0,
      upload: 0,
    },
    sortByKey: stringUtils.sortByKey,
    hasTransforms: false,
    uploadPercentage: -1
  };

  function init() {
    // load the jobs list for job id validation later on
    prlJobService.loadJobs();

    // check to see whether currentJob is set.
    // if it is, this isn't a new job, it's either a clone or an edit.
    if(prlJobService.currentJob) {
      // try to get the jobId from the url.
      // if it's set, this is a job edit
      var jobId = $route.current.params.jobId;

      // make a copy of the currentJob object. so we don't corrupt the real jobs
      $scope.job = prlJobService.cloneJob(prlJobService.currentJob);
      $scope.job = prlJobService.removeJobCounts($scope.job);

      if(jobId) {
        $scope.mode = MODE.EDIT;
        console.log("Editing job", prlJobService.currentJob);
        $scope.ui.pageTitle = "Editing Job " + $scope.job.id;
      } else {
        $scope.mode = MODE.CLONE;
        $scope.ui.wizard.step = 2;
        console.log("Cloning job", prlJobService.currentJob);
        $scope.ui.pageTitle = "Clone Job from " + $scope.job.id;
        $scope.job.id = "";
        setSchedulerUIText();
        setTransformsUIText();
        setBucketSpanUIText();
        setFieldDelimiterControlsFromText();
        $scope.getExampleTime();

        // if the schedulerConfig doesn't exist, assume we're cloning from a file upload job
        if(!$scope.job.schedulerConfig) {
          $scope.ui.wizard.dataLocation = "FILE";

          // make a list of influencers comprising of the influencers in the job minus
          // the output fields generated by the transforms.
          // assume all remaining influencers are standard influencers
          var outputs = getTransformOutputs();
          $scope.ui.influencers = _.difference($scope.job.analysisConfig.influencers, outputs);
          // create the transform influencers
          $scope.addTransformsToProperties();
          // note, when cloning an ES job, the influencers are created once the
          // ES data directive has loaded the server details.
          // cloneJobDataDescriptionCallback() is called once the server details have loaded
        } else {
          // remove encryptedPassword when cloning a job, so the user has to
          // has to re-enter the password
          if($scope.job.schedulerConfig.encryptedPassword) {
            delete $scope.job.schedulerConfig.encryptedPassword;
          }
        }
      }

      // clear the current job
      prlJobService.currentJob = undefined;

    } else {
      $scope.mode = MODE.NEW;
      console.log("Creating new job");
      $scope.job = {
        id: "",
        description: "",
        analysisConfig: {
          bucketSpan: 300,
          influencers:[],
          detectors :[]
        },
        // dataDescription : {
        //   timeField:      "time",
        //   timeFormat:     "yyyy-MM-dd'T'HH:mm:ssZ", // "epoch",
        //   fieldDelimiter: ",",
        //   quoteCharacter: "\"",
        //   format:         "DELIMITED"
        // }
        dataDescription : {
          timeField:      "",
          timeFormat:     "", // "epoch",
          fieldDelimiter: "",
          quoteCharacter: "\"",
          format:         "DELIMITED"
        }
      };
      calculateSchedulerFrequencyDefault();
    }
    showDataPreviewTab();
  }

  function changeTab(tab) {
    $scope.ui.currentTab = tab.index;
    if(tab.index === 5) {
      createJSONText();
    } else if(tab.index === 6) {
      if($scope.ui.wizard.dataLocation === "ES" /*&&
         $scope.ui.wizard.dataPreview !== ""*/) {
        loadDataPreview();
      }
    }
  }

  function wizardStep(step) {
    $scope.ui.wizard.step += step;
    if($scope.ui.wizard.step === 1) {
       if($scope.ui.wizard.dataLocation === "NONE") {
        // no data option was selected. jump to wizard step 2
        $scope.ui.wizard.forward();
        return;
      }
    } else if($scope.ui.wizard.step === 2) {
      if($scope.ui.wizard.dataLocation === "ES") {
        $scope.ui.isScheduled = true;

        $scope.job.dataDescription.format = "ELASTICSEARCH";

        if($scope.timeFieldSelected()) {
          var time = $scope.job.dataDescription.timeField;
          if(time && $scope.dateProperties[time]) {
            $scope.job.dataDescription.timeField = time;
          }
        }
      } else if($scope.ui.wizard.dataLocation === "FILE") {

      }
      $scope.getExampleTime();
    }

    showDataPreviewTab();
  }

  $scope.save = function() {
    console.log("save() job: ", $scope.job);
    msgs.clear();
    getDelimiterSelection();
    getSchedulerSelection();

    if( validateJob() ) {
      var overwrite = false;
      // if basic validation passes
      // check that the job id doesn't already exist
      // if they want to replace or the job id is fine, move the next step, checkInfluencers.
      // if(jobExists($scope.job.id)) {
      var tempJob = prlJobService.getJob($scope.job.id);
      if(tempJob) {
        // if the job id exists and that job is currently CLOSED, display a warning
        if(tempJob.status === "CLOSED") {
          prlConfirm.open({
            message: "Job '"+$scope.job.id+"' already exists. <br />Overwriting it will remove all previous results which cannot be undone.<br />Do you wish to continue?",
            title: $scope.job.id+ " already exists",
            okLabel: "Overwrite",
            size: "",
          }).then(function() {
              overwrite = true;
              checkInfluencers();
            })
            .catch(function() {
              displayJobIdError();
            });
        } else {
          // if the job is not CLOSED, stop the save altogether and display a message
          prlConfirm.open({
            message: "Only jobs which are CLOSED can be overwritten.<br />Please choose a different name or close the job",
            title: "Job '"+$scope.job.id+ "' already exists and is "+tempJob.status,
            okLabel: "OK",
            hideCancel: true,
            size: "",
          }).then(function() {
            displayJobIdError();
          });
        }
      } else {
        checkInfluencers();
      }

      // flag up the error on the first tab about the job id already existing
      function displayJobIdError(){
        var tab = $scope.ui.validation.tabs[0];
        tab.valid = false;
        tab.checks.jobId.valid = false;
        tab.checks.jobId.message = "'" + $scope.job.id + "' already exists, please choose a different name";
        changeTab({index:0});
      }

      function checkInfluencers() {
        // check that they have chosen some influencers
        if($scope.job.analysisConfig.influencers &&
           $scope.job.analysisConfig.influencers.length) {
          checkAuthentication();
        } else {
          // if there are no influencers set, open a confirmation
          prlConfirm.open({
            message: "You have not chosen any influencers, do you want to continue?",
            title: "No Influencers"
          }).then(checkAuthentication)
            .catch(function() {
              changeTab({index:2});
            });
        }
      }

      function checkAuthentication() {
        // check that the password has been set if a username has
        if(!$scope.ui.isScheduled) {
          saveFunc();
        } else {
          if($scope.job.schedulerConfig.username && !$scope.job.schedulerConfig.password) {
            prlConfirm.open({
              message: "You have entered an empty password",
              title: "No password"
            }).then(saveFunc)
              .catch(function() {
                changeTab({index:4});
              });
          } else {
            saveFunc();
          }
        }
      }

      function saveFunc() {
        $scope.saveLock = true;
        $scope.ui.saveStatus.job = 1;
        $scope.ui.uploadPercentage = -1;
        openSaveStatusWindow();

        prlJobService.saveNewJob($scope.job, overwrite)
          .then(function (result) {
            if(result.success) {
              // After the job has been successfully created the Elasticsearch
              // mappings should be fully set up, but the Kibana mappings then
              // need to be refreshed to reflect the Elasticsearch mappings
              courier.indexPatterns.get('prelertresults-*')
              .then(function(indexPattern) {
                indexPattern.refreshFields()
                .then(function() {
                  console.log("refreshed fields for index pattern prelertresults-*");

                  // wait for mappings refresh before continuing on with the post save stuff
                  msgs.info("New Job '"+result.resp.id + "' added");
                  // remember the es server url for next time
                  storeBaseUrl($scope.ui.scheduler.baseUrlText);
                  // update status
                  $scope.ui.saveStatus.job = 2;

                  // data has been uploaded through the wizard and
                  // post save upload tickbox is checked
                  if($scope.ui.wizard.dataLocation === "FILE" &&
                     $scope.ui.wizard.uploadedData &&
                     $scope.ui.postSaveUpload) {

                    $scope.ui.saveStatus.upload = 1;
                    fileUploadProgress($scope.job.id);

                    // upload the data
                    prlJobService.uploadData($scope.job.id, $scope.ui.wizard.uploadedData)
                    .then(function(resp) {
                      // update status
                      $scope.ui.saveStatus.upload = 2;
                      $scope.ui.uploadPercentage = 100;
                      msgs.info($scope.ui.wizard.fileName+" uploaded to "+$scope.job.id);
                      // $location.path("jobs");
                      $scope.saveLock = false;
                    })
                    .catch(function(resp) {
                      $scope.ui.saveStatus.upload = -1;
                      $scope.ui.uploadPercentage = -1;

                      if(resp.responses && resp.responses.length) {
                        msgs.error("Upload error: "+resp.responses[0].error.message);
                      } else if (resp.message) {
                        msgs.error("Upload error: "+resp.message);
                      } else {
                        msgs.error("Upload error: data could not be uploaded");
                      }
                      $scope.saveLock = false;
                    });

                  } else {
                    $scope.saveLock = false;
                    // no data to upload, go back to the jobs list
                  }
                });
              });
            } else {
              // save failed, unlock the buttons and tell the user
              $scope.ui.saveStatus.job = -1;
              $scope.saveLock = false;
              msgs.error("Save failed: "+result.resp.message );
            }
          }).catch(function (result) {
            $scope.ui.saveStatus.job = -1;
            $scope.saveLock = false;
            msgs.error("Save failed: "+result.resp.message );
          });
      }

    }
    else {
      msgs.error("Fill in all required fields");
      console.log("save(): job validation failed");
    }
  };

  $scope.cancel = function () {
    prlConfirm.open({
      message:"Are you sure you want to cancel job creation?",
      title: "Are you sure?"
    })
      .then(function() {
        msgs.clear();
        $location.path("jobs");
      });
  };

  // called after loading ES data when cloning a job
  $scope.cloneJobDataDescriptionCallback = function () {
    extractCustomInfluencers();
    $scope.addTransformsToProperties();
  };

  $scope.indexSelected = function(){
    if($scope.ui.wizard.indexInputType === "TEXT") {
      // if the user is entering index text manually, check that the text isn't blank
      // and a match to an index has been made resulting in some fields.
      return ($scope.ui.scheduler.indicesText.length && Object.keys($scope.properties).length)?true:false;
    } else {
      return Object.keys($scope.indices).length?true:false;
    }
  };

  $scope.timeFieldSelected = function(){
    return ($scope.job.dataDescription.timeField === "")?false:true;
  };

  $scope.jsonTextChange = function() {
    try {
      // the json text may contain comments which are illegal in json and so causes problems
      // for the parser, minifying first strips these out
      var minfiedJson = JSON.minify($scope.ui.jsonText);
      // create the job from the json text.
      $scope.job = JSON.parse(minfiedJson);
      $scope.changeJobIDCase();

      // in case influencers have been added into the json. treat them as custom if unrecognised
      extractCustomInfluencers();

      setFieldDelimiterControlsFromText();
      setSchedulerUIText();
      setBucketSpanUIText();
    } catch(e) {
      console.log("JSON could not be parsed");
      // a better warning should be used.
      // colour the json text area red and display a warning somewhere. possibly in the message bar.
    }
  };

  // force job ids to be lowercase
  $scope.changeJobIDCase = function() {
    if($scope.job.id) {
      $scope.job.id = $scope.job.id.toLowerCase();
    }
  };

  // called when the scheduler tickbox is toggled.
  // creates or destroys the scheduler section in the config
  $scope.schedulerChange = function() {
    if($scope.ui.isScheduled) {
      $scope.job.schedulerConfig = {};
      for(var i = 0; i < $scope.ui.dataSources.length; i++) {
        if($scope.ui.dataSources[i].value === $scope.ui.scheduler.dataSourceText) {
          $scope.job.dataDescription.format = $scope.ui.dataSources[i].dataFormat;
        }
      }
    } else {
      delete $scope.job.schedulerConfig;
    }

    showDataPreviewTab();
  };

  // called when the transforms tickbox is toggled.
  // creates or destroys the transforms section in the config
  $scope.hasTransformChange = function() {
    if($scope.ui.hasTransforms) {
      $scope.job.transforms = [];
    } else {
      delete $scope.job.transforms;
    }
  };

  // general function to remove an analysisConfig property from the config if it's an empty string
  $scope.generalAnalysisConfigFieldNameChange = function(name) {
    if($scope.job.analysisConfig[name].trim() === "") {
      delete $scope.job.analysisConfig[name];
    }
  };

  function clear(obj) {
    Object.keys(obj).forEach(function(key) { delete obj[key]; });
    if(Array.isArray(obj)) {
      obj.length = 0;
    }
  }

  // triggered when the user changes the JSON text
  // reflect the changes in the UI
  function setSchedulerUIText() {
    if($scope.job.schedulerConfig) {
      var schedulerConfig = $scope.job.schedulerConfig;

      $scope.ui.isScheduled = true;
      $scope.ui.wizard.dataLocation = "ES";
      showDataPreviewTab();

      var frequencyDefault = $scope.ui.scheduler.frequencyDefault;
      var freq = schedulerConfig.frequency;
      if($scope.ui.scheduler.frequencyDefault === schedulerConfig.frequency) {
        freq = "";
      }

      var scrollSizeDefault = $scope.ui.scheduler.scrollSizeDefault;
      var scrollSize = schedulerConfig.scrollSize;
      if($scope.ui.scheduler.scrollSizeDefault === schedulerConfig.scrollSize) {
        scrollSize = "";
      }


      clear($scope.types);
      _.each(schedulerConfig.types, function(type, key) {
        $scope.types[type] = $scope.ui.types[type];
      });

      clear($scope.indices);
      _.each(schedulerConfig.indexes, function(index, key) {
        $scope.indices[index] = $scope.ui.indices[index];
      });

      // note, this will be overwritten when the mappings are loaded
      // if the ES server is a different version, this value will change
      // to the correct one.
      var dataSourceText = "ELASTICSEARCH_2X";
      if(schedulerConfig.dataSourceCompatibility === "1.7.x") {
        dataSourceText = "ELASTICSEARCH_17X";
      }

      $scope.ui.scheduler = {
        dataSourceText:        dataSourceText,
        queryText:             angular.toJson(schedulerConfig.query, true),
        queryDelayText:        +schedulerConfig.queryDelay,
        retrieveWholeSource:   schedulerConfig.retrieveWholeSource,
        frequencyText:         freq,
        frequencyDefault:      frequencyDefault,
        scrollSizeText:        scrollSize,
        scrollSizeDefault:     scrollSizeDefault,
        baseUrlText:           schedulerConfig.baseUrl,
        usernameText:          schedulerConfig.username,
        passwordText:          schedulerConfig.password,
        indicesText:           schedulerConfig.indexes.join(","),
        typesText:             schedulerConfig.types.join(","),
      };

      // if the username is set, show the authentication fields
      if($scope.ui.scheduler.usernameText) {
        $scope.ui.wizard.serverAuthenticated = true;
      }

      // load the mappings from the configured server
      // via the functions exposed in the elastic data controller
      if(typeof $scope.prlElasticDataDescriptionExposedFunctions.extractFields === "function") {
        $scope.prlElasticDataDescriptionExposedFunctions.getMappings(function() {
          $scope.prlElasticDataDescriptionExposedFunctions.extractFields({types: $scope.types});
        });
      }

    } else {
      $scope.ui.isScheduled = false;
    }
  }

  // check the transforms checkbox if the transforms section is found in the job config
  function setTransformsUIText() {
    if($scope.job.transforms) {
      $scope.ui.hasTransforms = true;
    }
  }

  // function to manage the rare situation that a user
  // enters their own bucketSpan value in the JSON.
  // i.e, one that's not in the select's list ($scope.ui.bucketSpanValues)
  function setBucketSpanUIText() {
    var bs = $scope.job.analysisConfig.bucketSpan;
    var bvs = $scope.ui.bucketSpanValues;

    // remove any previosuly added custom entries first
    for(var i = bvs.length -1; i >= 0 ; i--){
      if(bvs[i].custom){
        bvs.splice(i, 1);
      }
    }

    var found = _.findWhere(bvs, {value: bs});
    // if the bucketSpan isn't in the list, add it to the end
    if(!found) {
      bvs.push({
        value:  bs,
        title:  bs + " seconds",
        custom: true
      });
    }
  }

  // work out the default frequency based on the bucketSpan
  function calculateSchedulerFrequencyDefault() {
    var bs = $scope.job.analysisConfig.bucketSpan;

    var freq = 3600;
    if(bs <= 120) {
      freq = 60;
    } else if (bs <= 1200) {
      freq = Math.floor(bs/2);
    } else if(bs <= 43200) {
      freq = 600;
    }

    $scope.ui.scheduler.frequencyDefault = freq;
  }

  // scope version of the above function
  $scope.calculateSchedulerFrequencyDefault = calculateSchedulerFrequencyDefault;


  function setFieldDelimiterControlsFromText() {
    if ($scope.job.dataDescription && $scope.job.dataDescription.fieldDelimiter) {

      // if the data format has not been set and fieldDelimiter exists,
      // assume the format is DELIMITED
      if($scope.job.dataDescription.format === undefined) {
        $scope.job.dataDescription.format = "DELIMITED";
      }

      var fieldDelimiter = $scope.job.dataDescription.fieldDelimiter;
      $scope.ui.selectedFieldDelimiter = "custom";
      $scope.ui.customFieldDelimiter = "";
      var isCustom = true;
      for (var i = 0; i < $scope.ui.fieldDelimiterOptions.length - 1; i++) {
        if ($scope.ui.fieldDelimiterOptions[i].value === fieldDelimiter) {
          isCustom = false;
          $scope.ui.selectedFieldDelimiter = $scope.ui.fieldDelimiterOptions[i].value;
        }
      }
      if (isCustom) {
        $scope.ui.customFieldDelimiter = fieldDelimiter;
      }
    }
  }

  function getDelimiterSelection() {
    if ($scope.job.dataDescription.format === "DELIMITED") {
      var selectedFieldDelimiter = $scope.ui.selectedFieldDelimiter;
      if (selectedFieldDelimiter === "custom") {
        $scope.job.dataDescription.fieldDelimiter = $scope.ui.customFieldDelimiter;
      }
      else {
        $scope.job.dataDescription.fieldDelimiter = selectedFieldDelimiter;
      }
    } else {
      delete $scope.job.dataDescription.fieldDelimiter;
      delete $scope.job.dataDescription.quoteCharacter;
    }
  }

  // create the schedulerConfig section of the job config
  function getSchedulerSelection() {
    if($scope.ui.isScheduled) {
      var sch = $scope.ui.scheduler;

      if(sch.queryDelayText === "") {
        sch.queryDelayText = 60;
      }

      if(sch.queryText === "") {
        sch.queryText = '{"match_all":{}}';
      }
      var query = sch.queryText;
      try {
        query = JSON.parse(query);
      } catch(e){
        console.log("getSchedulerSelection(): could not parse query JSON");
      }

      var indexes = [];
      if(sch.indicesText) {
        indexes= sch.indicesText.split(",");
        for(var i=0;i<indexes.length;i++) {
          indexes[i] = indexes[i].trim();
        }
      }

      var types = [];
      if(sch.typesText) {
        types = sch.typesText.split(",");
        for(var i=0;i<types.length;i++) {
          types[i] = types[i].trim();
        }
      }

      // create schedulerConfig if it doesn't already exist
      if(!$scope.job.schedulerConfig) {
        $scope.job.schedulerConfig = {};
      }

      var dataSourceText = "ELASTICSEARCH";
      var dataSourceCompatibility = "2.x.x";
      if(sch.dataSourceText === "ELASTICSEARCH_17X") {
        dataSourceCompatibility = "1.7.x";
      }

      var config = $scope.job.schedulerConfig;

      config.dataSource =               dataSourceText;
      config.dataSourceCompatibility =  dataSourceCompatibility;
      config.query =                    query;
      config.queryDelay =               sch.queryDelayText;
      config.retrieveWholeSource =      sch.retrieveWholeSource;
      config.frequency =                ((sch.frequencyText === "" || sch.frequencyText === null || sch.frequencyText === undefined)?sch.frequencyDefault:sch.frequencyText);
      config.scrollSize =               ((sch.scrollSizeText === "" || sch.scrollSizeText === null || sch.scrollSizeText === undefined)?sch.scrollSizeDefault:sch.scrollSizeText);
      config.baseUrl =                  sch.baseUrlText;
      config.indexes =                  indexes;
      config.types =                    types;

      // set or delete username
      if (sch.usernameText) {
        config.username = sch.usernameText;
      } else {
        delete config.username;
      }

      // set or delete passwords
      if (sch.passwordText) {
        config.password = sch.passwordText;
      } else {
        delete config.password;
      }
    }
  }

  function getCustomUrlSelection() {
    // if no custom urls have been created, delete the whole custom settings item
    if($scope.job.customSettings && $scope.job.customSettings.customUrls) {
      if($scope.job.customSettings.customUrls.length === 0) {
        delete $scope.job.customSettings;
      }
    }
  }

  function getCategorizationFilterSelection() {
    // if no filters have been created, delete the filter array
    if($scope.job.analysisConfig && $scope.job.analysisConfig.categorizationFilters) {
      if($scope.job.analysisConfig.categorizationFilters.length === 0) {
        delete $scope.job.analysisConfig.categorizationFilters;
      }
    }
  }

  function createJSONText() {
    getDelimiterSelection();
    getSchedulerSelection();
    getCustomUrlSelection();
    getCategorizationFilterSelection();
    $scope.ui.jsonText = angular.toJson($scope.job, true);
  }

  // add new custom URL
  $scope.addCustomUrl = function() {
    if(!$scope.job.customSettings) {
      $scope.job.customSettings = {};
    }
    if(!$scope.job.customSettings.customUrls) {
      $scope.job.customSettings.customUrls = [];
    }

    $scope.job.customSettings.customUrls.push({ urlName: "", urlValue: "" });
  };

  // remove selected custom URL
  $scope.removeCustomUrl = function(index) {
    $scope.job.customSettings.customUrls.splice(index, 1);
  };

  // add new categorization filter
  $scope.addCategorizationFilter = function() {
    if($scope.job.analysisConfig) {
      if(!$scope.job.analysisConfig.categorizationFilters) {
          $scope.job.analysisConfig.categorizationFilters = [];
      }

      $scope.job.analysisConfig.categorizationFilters.push("");
    }
  };

  // remove selected categorization filter
  $scope.removeCategorizationFilter = function(index) {
    if($scope.job.analysisConfig && $scope.job.analysisConfig.categorizationFilters) {
      $scope.job.analysisConfig.categorizationFilters.splice(index, 1);
    }
  };


  $scope.influencerChecked = function(inf) {
    return (_.contains($scope.job.analysisConfig.influencers, inf));
  };

  $scope.toggleInfluencer = function(inf) {
    var influencers = $scope.job.analysisConfig.influencers;
    if($scope.influencerChecked(inf)) {
      for(var i=0;i<influencers.length; i++) {
        if(influencers[i] === inf) {
          $scope.job.analysisConfig.influencers.splice(i, 1);
        }
      }
    } else {
      $scope.job.analysisConfig.influencers.push(inf);
    }
  };

  $scope.addCustomInfluencer = function() {
    if($scope.ui.tempCustomInfluencer !== "") {
      $scope.ui.customInfluencers.push($scope.ui.tempCustomInfluencer);
      $scope.ui.tempCustomInfluencer = "";
    }
  };

  // look at the difference between loaded ES influencers and the ones in the current job.
  // unrecognised influencers must have been added by the user.
  function extractCustomInfluencers() {
    var allInfluencers = $scope.ui.influencers.concat($scope.ui.transformInfluencers);
    $scope.ui.customInfluencers = _.difference($scope.job.analysisConfig.influencers, allInfluencers, getTransformOutputs());
    console.log("extractCustomInfluencers: ", $scope.ui.customInfluencers);
  }

  // get an array of outputs from the configured transforms
  function getTransformOutputs() {
    var allOutputs = [];
    _.each($scope.job.transforms, function(trfm) {
      var outputs = trfm.outputs;
      var DEFAULT_OUTPUTS = prlTransformsDefaultOutputs;

      // no outputs, use defaults for the transform
      if(outputs === undefined ) {
        outputs = DEFAULT_OUTPUTS[trfm.transform];
      }

      // some transforms don't have outputs, so don't add them
      if(outputs !== undefined ) {
        allOutputs = allOutputs.concat(outputs);
      }
    });
    return allOutputs;
  }

  $scope.addTransformsToProperties = function(){
    // clear existing transform based properties
    _.each($scope.properties, function(prop, i) {
      if(prop.transform) {
        delete $scope.properties[i];
      }
    });

    var outputs = getTransformOutputs();
    // add the outputs to the properties object
    _.each(outputs, function(op) {
      if(!$scope.properties[op]) {
        $scope.properties[op] = {type: "date", transform: true};
      }
    });

    // refresh the list of transform influencers
    $scope.ui.transformInfluencers = outputs;

    // remove checked influencers which now no longer exist in standard, custom or transform influencer lists.
    var allInfluencers = $scope.ui.influencers.concat($scope.ui.customInfluencers, $scope.ui.transformInfluencers);
    var checkedInfuencers = $scope.job.analysisConfig.influencers;
    for(var i = checkedInfuencers.length -1; i >= 0 ; i--){
      if(_.indexOf(allInfluencers, checkedInfuencers[i]) === -1 ){
        checkedInfuencers.splice(i, 1);
      }
    }
  };

  // function used to check that all required fields are filled in
  function validateJob() {
    var valid = true;

    var tabs = $scope.ui.validation.tabs;
    // reset validations
    _.each(tabs, function(tab) {
      tab.valid = true;
        for(var check in tab.checks) {
          tab.checks[check].valid = true;
          tab.checks[check].message = "";
        }
    });

    var job = $scope.job;
    if(job) {
      // tab 0 - Job Details
      // job already exists check happens in save function
      // as users may wish to continue and overwrite existing job
      if(_.isEmpty(job.id)) {
        tabs[0].checks.jobId.valid = false;
      } else if(!job.id.match(/^[a-z0-9\-\_]{1,64}$/g) ) {
        tabs[0].checks.jobId.valid = false;
        tabs[0].checks.jobId.message = "Job name must be a lowercase alphanumeric word no greater than 64 characters long. It may contain hyphens or underscores.";
      }

      // tab 2 - Analysis Configuration
      if(job.analysisConfig.categorizationFilters ) {
        var v = true;
        _.each(job.analysisConfig.categorizationFilters, function(d) {
          try {
            new RegExp(d);
          } catch(e) {
            v = false;
          }

          if(job.analysisConfig.categorizationFieldName === undefined || job.analysisConfig.categorizationFieldName === "") {
            tabs[2].checks.categorizationFilters.message = "categorizationFieldName must be set to allow filters";
            v = false;
          }

          if( d === "" || v === false) {
            tabs[2].checks.categorizationFilters.valid = false;
            valid = false;
          }
        });
      }


      if(job.analysisConfig.detectors.length === 0) {
        tabs[2].checks.detectors.valid = false;
      } else {
        _.each(job.analysisConfig.detectors, function(d) {
          if( _.isEmpty(d.function)) {
            valid = false;
          }
        });
      }

      if(job.analysisConfig.influencers &&
         job.analysisConfig.influencers.length === 0) {
        // tabs[2].checks.influencers.valid = false;
      }

      // tab 3 - Data Description
      if(_.isEmpty(job.dataDescription.timeField)) {
        tabs[3].checks.timeField.valid = false;
      }

      if(_.isEmpty(job.dataDescription.timeFormat)) {
        tabs[3].checks.timeFormat.valid = false;
      }

      // scheduler
      if(job.dataDescription.format==="ELASTICSEARCH") {
        if((!job.schedulerConfig || $scope.ui.isScheduled === false)) {
          tabs[4].checks.isScheduled.valid = false;
          tabs[4].checks.jobId.message = "Elasticsearch has been specified as the data format, but no scheduler settings have been added.";
        }
        if($scope.ui.validation.serverAuthenticationError !== "") {
          tabs[4].checks.isScheduled.valid = false;
        }
      }

    } else {
      valid = false;
    }

    // for each tab, set its validity based on its contained checks
    _.each(tabs, function(tab) {
      _.each(tab.checks, function(item) {
        if(item.valid === false) {
          // set tab valid state to false
          tab.valid = false;
          // set overall valid state to false
          valid = false;
        }
      });
    });

    return valid;
  }

  // check that a job id hasn't already been used
  function jobExists(jobId) {
    var exists = false;
    var jobIds = _.map(prlJobService.jobs, function(job){return job.id;});
    if(_.indexOf(jobIds, jobId) >= 0) {
      exists = true;
    }
    return exists;
  }

  // add url to localstorage
  // note, this is only stored if save was successful
  function storeBaseUrl(url) {
    var list = $scope.ui.storedUrls;
    if(_.contains(list, url) === false) {
      if(typeof Storage !== "undefined" && list !== undefined) {
        list.push(url);
        window.localStorage["storedUrls"] = JSON.stringify(list);
      } else {
        console.log("rememberBaseUrl: url could not be added to local storage");
      }
    }
  }

  // retrieve array of urls from localstorage
  function loadStoredBaseUrls() {
    var list = [];
    if(typeof(Storage) !== "undefined" &&
       window.localStorage["storedUrls"]) {
      list = JSON.parse(window.localStorage["storedUrls"]);
    }
    return list;
  }


  function openSaveStatusWindow() {
    var modalInstance = $modal.open({
      template: require('plugins/prelert/jobs/components/new_job/save_status_modal/save_status_modal.html'),
      controller: 'PrlSaveStatusModal',
      backdrop: "static",
      keyboard: false,
      size: "sm",
      resolve: {
        params: function() {
          return {
            pscope:           $scope,
            openScheduler:    function() {
              prlSchedulerService.openJobTimepickerWindow($scope.job);
            },
            showUploadStatus: ( ($scope.ui.wizard.dataLocation === 'FILE' && $scope.ui.wizard.uploadedData !== '' && $scope.ui.postSaveUpload)? true: false )
          };
        }
      }
    });
  }

  // while data is being uploaded, load the processedRecordCount and work out
  // a progress percentage based on a guess of the records count in the file.
  function fileUploadProgress(jobId) {
    var trackFileUploadTimeout;
    var records = 0;
    var pollTime = 2; // seconds

    try {
      if($scope.job.dataDescription.format === "DELIMITED") {
        // assume each line is a record
        records = $scope.ui.wizard.uploadedData.split("\n").length;
        records = records - 2;
      } else if($scope.job.dataDescription.format === "JSON") {
        // if the json is an array, assume each element is a record
        if(Array.isArray($scope.ui.wizard.uploadedData)) {
          records = $scope.ui.wizard.uploadedData.length;
        } else {
          // assume each line is a separate json object and record
          records = $scope.ui.wizard.uploadedData.split("\n").length;
        }
      }

       var refresh = function() {
        prlJobService.loadJob(jobId)
        .then(function(resp) {
          if(resp && $scope.ui.saveStatus.upload !== -1) {
            $scope.ui.uploadPercentage = Math.round((resp.counts.processedRecordCount/records)*100);
            if($scope.ui.uploadPercentage <= 100) {
              // console.log("fileUploadProgress():", $scope.ui.uploadPercentage);
              if($scope.ui.saveStatus.upload === 1) {
                trackFileUploadTimeout = $timeout(refresh, (pollTime*1000) );
              }
            } else {
              // more than 100% ?
              // just hide the progress bar
              $scope.ui.uploadPercentage = -1;
            }
          }
        });
      };

      if(records > 0) {
        refresh();
      }
    } catch(e) {
      console.log("fileUploadProgress: progress bar failed to render ", e);
    }
  }

  // using the selected indices and types, perform a search
  // on the ES server and display the results in the Data preview tab
  function loadDataPreview() {
    createJSONText();
    $scope.ui.wizard.dataPreview = "";

    var indices = Object.keys($scope.indices);
    var types = Object.keys($scope.types);
    var url = $scope.ui.scheduler.baseUrlText;
    var username = $scope.ui.scheduler.usernameText;
    var password = $scope.ui.scheduler.passwordText;
    var job = $scope.job;
    if(indices.length) {
      prlJobService.searchPreview(url, username, password, indices, types, job)
        .then(function(resp) {
          $scope.ui.wizard.dataPreview = angular.toJson(resp, true);
        })
        .catch(function(resp) {
          $scope.ui.wizard.dataPreview = angular.toJson(resp, true);
        });
      }
  }

  function showDataPreviewTab() {
    var hidden = true;
    // if this is a scheduled job or a file upload, make the Data Preview tab available
    if($scope.ui.isScheduled || $scope.ui.wizard.dataLocation === "FILE") {
      hidden = false;
    }

    // however, if cloning a file upload job, don't display the preview tab
    if($scope.ui.wizard.dataLocation === "FILE" && $scope.mode === MODE.CLONE) {
      hidden = true;
    }

    $scope.ui.tabs[6].hidden = hidden;
    $scope.$applyAsync();
  }

  $scope.getExampleTime = function() {
    $scope.exampleTime = stringUtils.generateExampleTime($scope.job.dataDescription.timeFormat);
  };

  // combine all influencers into a sorted array
  function allInfluencers() {
    var influencers = $scope.ui.influencers.concat($scope.ui.transformInfluencers, $scope.ui.customInfluencers);
    // deduplicate to play well with ng-repeat
    influencers = _.uniq(influencers);

    return _.sortBy(influencers, function(inf) {return inf;});
  }

  init();
})
// custom filter to filter transforms from the properties datalist
// used only for the summaryCountFieldName field datalist
.filter('filterTransforms', function() {
  return function(input) {
    var tempObj = {};
    _.each(input, function(v,i) {
      if(!v.transform) {
        tempObj[i] = v;
      }
    });
    return tempObj;
  };
});
