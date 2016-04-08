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



var _ = require('lodash');
var moment = require('moment');
var uuid = require('node-uuid');
module.exports = function (options) {

  options = _.defaults(options || {}, {
    indices: 20,
    nodes: 1,
    shards: 5,
    replicas: 1
  });

  var state = {
    _id: new Date().getTime() + Math.random(),
    cluster_name: 'gigantic-cluster',
    state_uuid: uuid.v4(),
    metadata: { cluster_uuid: uuid.v4() },
    version: 0,
    nodes: {},
    routing_table: {
      indices: {}
    },
    routing_nodes: {
      unassigned: [],
      nodes: {}
    }
  };

  // Generate Nodes
  _.times(options.nodes, function (n) {
    var id = uuid.v4();
    state.nodes[id] = {
      name: 'Node ' + (n + 1),
      transport_address: 'inet[localhost/127.0.0.1:' + (9300 + n) + ']',
      attributes: {}
    };
    state.routing_nodes.nodes[id] = [];
  });

  var nodeIds       = _.keys(state.nodes);
  state.master_node = nodeIds[0];
  var currentNode   = 0;

  var getNode = function () {
    var node = nodeIds[currentNode];
    if (options.nodes > 1) {
      if (currentNode < (options.nodes - 1)) {
        currentNode++;
      } else {
        currentNode = 0;
      }
    }
    return node;
  };

  // Generate Indices
  _.times(options.indices, function (n) {
    var index = moment().subtract(n, 'days').format('[logstash-]YYYY.MM.DD');
    _.times(options.shards, function (shard) {

      // Generate Primary Shards
      var node = getNode();
      var shardObj = {
        state           : 'STARTED',
        primary         : true,
        node            : node,
        relocating_node : null,
        shard           : shard,
        index           : index
      };
      state.routing_nodes.nodes[node].push(shardObj);
      if (!state.routing_table.indices[index]) state.routing_table.indices[index] = { shards: [] };
      state.routing_table.indices[index].shards.push(shardObj);

      // Generate Replica Shards
      _.times(options.replicas, function () {
        var shardState      = (options.nodes < 2) ? 'UNASSIGNED' : 'STARTED';
        var replicaNode     = (options.nodes < 2) ? null : getNode();
        var shardCollection = (options.nodes < 2) ? state.routing_nodes.unassigned : state.routing_nodes.nodes[replicaNode];
        var replicaShardObj = {
          state           : shardState,
          primary         : false,
          node            : replicaNode,
          relocating_node : null,
          shard           : shard,
          index           : index
        };
        shardCollection.push(replicaShardObj);
        state.routing_table.indices[index].shards.push(replicaShardObj);
      });

    });
  });
  return state;
};

