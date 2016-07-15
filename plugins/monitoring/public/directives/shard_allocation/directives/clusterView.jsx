/**
 * ELASTICSEARCH CONFIDENTIAL
 * _____________________________
 *
 *  [2014] Elasticsearch Incorporated All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Elasticsearch Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Elasticsearch Incorporated
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Elasticsearch Incorporated.
 */

var React = require('react');
var ClusterView = require('plugins/monitoring/directives/shard_allocation/components/clusterView');
var module = require('ui/modules').get('monitoring/directives', []);

module.directive('clusterView', function (kbnUrl) {
  return {
    restrict: 'E',
    scope: {
      totalCount: '=',
      filter: '=',
      showing: '=',
      labels: '=',
      shardStats: '='
    },
    link: function (scope, element) {
      React.render(<ClusterView scope={scope} kbnUrl={kbnUrl}></ClusterView>, element[0]);
    }
  };
});
