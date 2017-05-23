/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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

import template from './create_watch.html';
import email from './email.html';
import 'plugins/watcher/services/watch';

import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlCreateWatch', function (watchService, mlPostSaveService, $q) {
  return {
    restrict: 'AE',
    replace: false,
    scope: {
      jobId: '='
    },
    template,
    link: function ($scope) {
      mlPostSaveService.registerCreateWatch(createWatch);
      $scope.status = mlPostSaveService.status;
      $scope.STATUS = mlPostSaveService.STATUS;

      $scope.id = '';
      $scope.includeEmail = false;
      $scope.email = '';
      $scope.interval = '20m';
      $scope.watcherEditURL = '';
      $scope.threshold = { display:'critical', val:75 };
      $scope.ui = {
        thresholdOptions: [
          { display:'critical', val:75 },
          { display:'major', val:50 },
          { display:'minor', val:25 },
          { display:'warning', val:0 }
        ],
        setThreshold: (t) => {
          $scope.threshold = t;
        }
      };

      const emailSection = {
        email_me: {
          throttle_period_in_millis: 0,
          email: {
            profile: 'standard',
            to: [],
            subject: 'ML Watcher test',
            body: {
              html: email
            }
          }
        }
      };

      const watch = {
        trigger: {
          schedule: {
            interval: $scope.interval
          }
        },
        input: {
          search: {
            request: {
              search_type: 'query_then_fetch',
              indices: ['.ml-anomalies-*'],
              types: [],
              body: {
                size: 0,
                query: {
                  bool: {
                    filter: [{
                      query_string: {
                        query: 'result_type:bucket_influencer',
                        analyze_wildcard: false
                      }
                    }, {
                      bool: {
                        must: [{
                          range: {
                            timestamp: {
                              gte: `now-${$scope.interval}`
                            }
                          }
                        }, {
                          query_string: {
                            analyze_wildcard: false,
                            query: ''
                          }
                        }]
                      }
                    }]
                  }
                },
                aggs: {
                  byTime: {
                    date_histogram: {
                      field: 'timestamp',
                      interval: '300s',
                      min_doc_count: 1
                    },
                    aggs: {
                      maxAnomalyScore: {
                        max: {
                          field: 'anomaly_score'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        condition: {
          compare: {
            'ctx.payload.hits.total': {
              gt: $scope.threshold.val
            }
          }
        },
        actions: {

        }
      };

      $scope.createWatch = function () {
        console.log($scope.jobId);
        console.log(watch);
        createWatch($scope.jobId);
      };

      function createWatch(jobId) {
        const deferred = $q.defer();
        $scope.status.watch = mlPostSaveService.STATUS.SAVING;
        if (jobId !== undefined) {
          const id = `ml-${jobId}`;
          $scope.id = id;
          watch.input.search.request.body.query.bool.filter[1].bool.must[1].query_string.query = `job_id:${jobId}`;
          watch.condition.compare['ctx.payload.hits.total'].gt = $scope.threshold.val;

          if ($scope.includeEmail && $scope.email !== '') {
            const emails = $scope.email.split(',');
            emailSection.email_me.email.to = emails;
            watch.actions = {
              ...emailSection
            };
          }

          watch.trigger.schedule.interval = $scope.interval;

          const watchModel = {
            id,
            upstreamJSON: {
              id,
              watch
            }
          };

          if (id !== '') {
            watchService.saveWatch(watchModel)
            .then(() => {
              $scope.status.watch = mlPostSaveService.STATUS.SAVED;
              $scope.watcherEditURL = `${chrome.getBasePath()}/app/kibana#/management/elasticsearch/watcher/watches/watch/${id}/edit?_g=()`;
              deferred.resolve();
            })
            .catch(() => {
              $scope.status.watch = mlPostSaveService.STATUS.SAVE_FAILED;
              deferred.reject();
            });
          }
        } else {
          $scope.status.watch = mlPostSaveService.STATUS.SAVE_FAILED;
          deferred.reject();
        }
        return deferred.promise;
      }
    }
  };
});
