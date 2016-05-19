// Kibana wrapper
var d3 = require('d3');

module.exports = (function () {

  // Pluggable function to handle the comms with a server. Default impl here is
  // for use outside of Kibana server with direct access to elasticsearch
  var graphExplorer = function (indexName, typeName, request, responseHandler) {
    var dataForServer = JSON.stringify(request);
    $.ajax({
      type: 'POST',
      url: 'http://localhost:9200/' + indexName + '/_xpack/graph/_explore',
      dataType: 'json',
      contentType: 'application/json;charset=utf-8',
      async: true,
      data: dataForServer,
      success: function (data) {
        responseHandler(data);
      }
    });
  };
  var searcher = function (indexName, request, responseHandler) {
    var dataForServer = JSON.stringify(request);
    $.ajax({
      type: 'POST',
      url: 'http://localhost:9200/' + indexName + '/_search',
      dataType: 'json',
      contentType: 'application/json;charset=utf-8', //Not sure why this was necessary - worked without elsewhere
      async: true,
      data: dataForServer,
      success: function (data) {
        responseHandler(data);
      }
    });

  };

  // ====== Undo operations =============

  function AddNodeOperation(node, owner) {
    var self = this;
    var vm = owner;
    self.node = node;
    self.undo = function () {
      vm.arrRemove(vm.nodes, self.node);

      delete vm.nodesMap[self.node.id];
    };
    self.redo = function () {
      vm.nodes.push(self.node);
      vm.nodesMap[self.node.id] = self.node;
    };
  }

  function AddEdgeOperation(edge, owner) {
    var self = this;
    var vm = owner;
    self.edge = edge;
    self.undo = function () {
      vm.arrRemove(vm.edges, self.edge);
      delete vm.edgesMap[self.edge.id];
    };
    self.redo = function () {
      vm.edges.push(self.edge);
      vm.edgesMap[self.edge.id] = self.edge;
    };
  }

  function ReverseOperation(operation) {
    var self = this;
    var reverseOperation = operation;
    self.undo = reverseOperation.redo;
    self.redo = reverseOperation.undo;
  }

  function GroupOperation(receiver, orphan, vm) {
    var self = this;
    var vm = vm;
    self.receiver = receiver;
    self.orphan = orphan;
    self.undo = function () {
      self.orphan.parent = undefined;
    };
    self.redo = function () {
      self.orphan.parent = self.receiver;
    };
  }

  function UnGroupOperation(parent, child, vm) {
    var self = this;
    var vm = vm;
    self.parent = parent;
    self.child = child;
    self.undo = function () {
      self.child.parent = self.parent;
    };
    self.redo = function () {
      self.child.parent = undefined;
    };
  }


  function createWorkspace(options) {
    return new GraphWorkspace(options);
  }

  // The main constructor for our GraphWorkspace
  function GraphWorkspace(options) {
    var self = this;
    this.blacklistedNodes = [];
    this.options = options;
    this.undoLog = [];
    this.redoLog = [];
    this.selectedNodes = [];


    if (!options) {
      this.options = {};
    }
    this.nodesMap = {};
    this.edgesMap = {};
    this.searchTerm = '';


    //A sequence number used to know when a node was added
    this.seqNumber = 0;

    this.nodes = [];
    this.edges = [];
    this.lastRequest = null;
    this.lastResponse = null;
    this.changeHandler = options.changeHandler;
    if (options.graphExploreProxy) {
      graphExplorer = options.graphExploreProxy;
    }
    if (options.searchProxy) {
      searcher = options.searchProxy;
    }

    this.addUndoLogEntry = function (undoOperations) {
      self.undoLog.push(undoOperations);
      if (self.undoLog.length > 50) {
        //Remove the oldest
        self.undoLog.splice(0, 1);
      }
      self.redoLog = [];
    };


    this.undo = function () {
      var lastOps = this.undoLog.pop();
      if (lastOps) {
        this.stopLayout();
        this.redoLog.push(lastOps);
        for (var i in lastOps) {
          lastOps[i].undo();
        }
        this.runLayout();
      }
    };
    this.redo = function () {
      var lastOps = this.redoLog.pop();
      if (lastOps) {
        this.stopLayout();
        this.undoLog.push(lastOps);
        for (var i in lastOps) {
          lastOps[i].redo();
        }
        this.runLayout();
      }
    };


    //Determines if 2 nodes are connected via an edge
    this.areLinked = function (a, b) {
      if (a == b) return true;
      var allEdges = this.edges;
      for (var e in allEdges) {
        if (e.source == a) {
          if (e.target == b) {
            return true;
          }
        }
        if (e.source == b) {
          if (e.target == a) {
            return true;
          }
        }
      }
      return false;
    };

    //======== Selection functions ========

    this.selectAll = function () {
      self.selectedNodes = [];
      for (var n in self.nodes) {
        var node = self.nodes[n];
        if (node.parent == undefined) {
          node.isSelected = true;
          self.selectedNodes.push(node);
        } else {
          node.isSelected = false;
        }
      }
    };

    this.selectNone = function () {
      self.selectedNodes = [];
      for (var n in self.nodes) {
        var node = self.nodes[n];
        node.isSelected = false;
      }
    };

    this.selectInvert = function () {
      self.selectedNodes = [];
      for (var n in self.nodes) {
        var node = self.nodes[n];
        if (node.parent != undefined) {
          continue;
        }
        node.isSelected = !node.isSelected;
        if (node.isSelected) {
          self.selectedNodes.push(node);
        }
      }
    };

    this.selectNodes = function (nodes) {
      for (var n in nodes) {
        var node = nodes[n];
        node.isSelected = true;
        if (self.selectedNodes.indexOf(node) < 0) {
          self.selectedNodes.push(node);
        }
      }
    };

    this.selectNode = function (node) {
      node.isSelected = true;
      if (self.selectedNodes.indexOf(node) < 0) {
        self.selectedNodes.push(node);
      }
    };

    this.deleteSelection = function () {
      var allAndGrouped = self.returnUnpackedGroupeds(self.selectedNodes);

      // Nothing selected so process all nodes
      if (allAndGrouped.length == 0) {
        allAndGrouped = self.nodes.slice(0);
      }

      var undoOperations = [];
      for (var i in allAndGrouped) {
        var node = allAndGrouped[i];
        //We set selected to false because despite being deleted, node objects sit in an undo log
        node.isSelected = false;
        delete self.nodesMap[node.id];
        undoOperations.push(new ReverseOperation(new AddNodeOperation(node, self)));
      }
      self.arrRemoveAll(self.nodes, allAndGrouped);
      self.arrRemoveAll(self.selectedNodes, allAndGrouped);

      var danglingEdges = self.edges.filter(function (edge) {
        return self.nodes.indexOf(edge.source) < 0 || self.nodes.indexOf(edge.target) < 0;
      });
      for (var i in danglingEdges) {
        var edge = danglingEdges[i];
        delete self.edgesMap[edge.id];
        undoOperations.push(new ReverseOperation(new AddEdgeOperation(edge, self)));
      }
      self.addUndoLogEntry(undoOperations);
      self.arrRemoveAll(self.edges, danglingEdges);
      self.runLayout();
    };


    this.selectNeighbours = function () {
      var newSelections = [];
      for (var n in self.edges) {
        var edge = self.edges[n];
        if (!edge.topSrc.isSelected) {
          if (self.selectedNodes.indexOf(edge.topTarget) >= 0) {
            if (newSelections.indexOf(edge.topSrc) < 0) {
              newSelections.push(edge.topSrc);
            }
          }
        }
        if (!edge.topTarget.isSelected) {
          if (self.selectedNodes.indexOf(edge.topSrc) >= 0) {
            if (newSelections.indexOf(edge.topTarget) < 0) {
              newSelections.push(edge.topTarget);
            }
          }
        }
      }
      for (var i in newSelections) {
        var newlySelectedNode = newSelections[i];
        self.selectedNodes.push(newlySelectedNode);
        newlySelectedNode.isSelected = true;
      }
    };

    this.selectNone = function () {
      for (var n in self.selectedNodes) {
        self.selectedNodes[n].isSelected = false;
      }
      self.selectedNodes = [];
    };

    this.deselectNode = function (node) {
      node.isSelected = false;
      self.arrRemove(self.selectedNodes, node);
    };

    this.getAllSelectedNodes = function () {
      return this.returnUnpackedGroupeds(self.selectedNodes);
    };

    this.colorSelected = function (colorNum) {
      var selections = self.getAllSelectedNodes();
      for (var i in selections) {
        selections[i].color = colorNum;
      }
    };

    this.getSelectionsThatAreGrouped = function () {
      var result = [];
      var selections = self.selectedNodes;
      for (var i in selections) {
        var node = selections[i];
        if (node.numChildren > 0) {
          result.push(node);
        }
      }
      return result;
    };

    this.ungroupSelection = function () {
      var selections = self.getSelectionsThatAreGrouped();
      for (var i in selections) {
        var node = selections[i];
        self.ungroup(node);
      }
    };

    this.toggleNodeSelection = function (node) {
      if (node.isSelected) {
        self.deselectNode(node);
      } else {
        node.isSelected = true;
        self.selectedNodes.push(node);
      }
      return node.isSelected;
    };

    this.returnUnpackedGroupeds = function (topLevelNodeArray) {
      //Gather any grouped nodes that are part of this top-level selection
      var result = topLevelNodeArray.slice();


      // We iterate over edges not nodes because edges conveniently hold the top-most
      // node information.

      var edges = this.edges;
      for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];

        var topLevelSource = edge.topSrc;
        var topLevelTarget = edge.topTarget;

        if (result.indexOf(topLevelTarget) >= 0) {
          //visible top-level node is selected - add all nesteds starting from bottom up
          var target = edge.target;
          while (target.parent != undefined) {
            if (result.indexOf(target) < 0) {
              result.push(target);
            }
            target = target.parent;
          }
        }

        if (result.indexOf(topLevelSource) >= 0) {
          //visible top-level node is selected - add all nesteds starting from bottom up
          var source = edge.source;
          while (source.parent != undefined) {
            if (result.indexOf(source) < 0) {
              result.push(source);
            }
            source = source.parent;
          }
        }
      } //end of edges loop

      return result;
    };

    // ======= Miscellaneous functions

    this.clearGraph = function () {
      this.stopLayout();
      this.nodes = [];
      this.edges = [];
      this.undoLog = [];
      this.redoLog = [];
      this.nodesMap = {};
      this.edgesMap = {};
      this.blacklistedNodes = [];
      this.selectedNodes = [];
      this.lastResponse = null;

    };


    this.arrRemoveAll = function remove(arr, items) {
      for (var i = items.length; i--;) {
        self.arrRemove(arr, items[i]);
      }
    };

    this.arrRemove = function remove(arr, item) {
      for (var i = arr.length; i--;) {
        if (arr[i] === item) {
          arr.splice(i, 1);
        }
      }
    };

    this.getNeighbours = function (node) {
      var neighbourNodes = [];
      for (var e in self.edges) {
        var edge = self.edges[e];
        if (edge.topSrc == edge.topTarget) {
          continue;
        }
        if (edge.topSrc == node) {
          if (neighbourNodes.indexOf(edge.topTarget) < 0) {
            neighbourNodes.push(edge.topTarget);
          }
        }
        if (edge.topTarget == node) {
          if (neighbourNodes.indexOf(edge.topSrc) < 0) {
            neighbourNodes.push(edge.topSrc);
          }
        }
      }
      return neighbourNodes;
    };

    //Creates a query that represents a node - either simple term query or boolean if grouped
    this.buildNodeQuery = function (topLevelNode) {
      var containedNodes = [topLevelNode];
      containedNodes = self.returnUnpackedGroupeds(containedNodes);
      if (containedNodes.length == 1) {
        //Simple case - return a single-term query
        var tq = {};
        tq[topLevelNode.data.field] = topLevelNode.data.term;
        return {
          'term': tq
        };
      }
      var termsByField = {};
      for (var i in containedNodes) {
        var node = containedNodes[i];
        var termsList = termsByField[node.data.field];
        if (!termsList) {
          termsList = [];
          termsByField[node.data.field] = termsList;
        }
        termsList.push(node.data.term);
      }
      //Single field case
      if (Object.keys(termsByField).length == 1) {
        return {
          'terms': termsByField
        };
      }
      //Multi-field case - build a bool query with per-field terms clauses.
      var q = {
        'bool': {
          'should': []
        }
      };
      for (var field in termsByField) {
        var tq = {};
        tq[field] = termsByField[field];
        q.bool.should.push({
          'terms': tq
        });
      }
      return q;
    };

    //====== Layout functions ========

    this.stopLayout = function () {
      if (this.force) {
        this.force.stop();
      }
      this.force = null;
    };


    this.runLayout = function () {
      this.stopLayout();
      // The set of nodes and edges we present to the d3 layout algorithms
      // is potentially a reduced set of nodes if the client has used any
      // grouping of nodes into parent nodes.
      var effectiveEdges = [];
      var edges = self.edges;
      for (var e in edges) {
        var edge = edges[e];
        var topSrc = edge.source;
        var topTarget = edge.target;
        while (topSrc.parent != undefined) {
          topSrc = topSrc.parent;
        }
        while (topTarget.parent != undefined) {
          topTarget = topTarget.parent;
        }
        edge.topSrc = topSrc;
        edge.topTarget = topTarget;

        if (topSrc != topTarget) {
          effectiveEdges.push({
            'source': topSrc,
            'target': topTarget
          });
        }
      }
      var visibleNodes = self.nodes.filter(function (n) {
        return n.parent == undefined;
      });
      //reset then roll-up all the counts
      var allNodes = self.nodes;
      for (var n in allNodes) {
        var node = allNodes[n];
        node.numChildren = 0;
      }
      for (var n in allNodes) {
        var node = allNodes[n];
        while (node.parent != undefined) {
          node = node.parent;
          node.numChildren = node.numChildren + 1;
        }
      }
      this.force = d3.layout.force()
        .nodes(visibleNodes)
        .links(effectiveEdges)
        .friction(0.8)
        .linkDistance(100)
        .charge(-1500)
        .gravity(0.15)
        .theta(0.99)
        .alpha(0.5)
        .size([800, 600])
        .on('tick', function (e) {
          var nodeArray = self.nodes;
          var hasRollups = false;
          //Update the position of all "top level nodes"
          for (var i in nodeArray) {
            var n = nodeArray[i];
            //Code to support roll-ups
            if (n.parent == undefined) {
              n.kx = n.x;
              n.ky = n.y;
            } else {
              hasRollups = true;
            }
          };
          if (hasRollups) {
            for (var i in nodeArray) {
              var n = nodeArray[i];
              //Code to support roll-ups
              if (n.parent != undefined) {
                // Is a grouped node - inherit parent's position so edges point into parent
                // d3 thinks it has moved it to x and y but we have final say using kx and ky.
                var topLevelNode = n.parent;
                while (topLevelNode.parent != undefined) {
                  topLevelNode = topLevelNode.parent;
                }

                n.kx = topLevelNode.x;
                n.ky = topLevelNode.y;
              }
            }

          }
          if (self.changeHandler) {
            // Hook to allow any client to respond to position changes
            // e.g. angular adjusts and repaints node positions on screen.
            self.changeHandler();
          }
        });
      this.force.start();
    };


    //========Grouping functions==========

    //Merges all selected nodes into node
    this.groupSelections = function (node) {
      var ops = [];
      self.nodes.forEach(function (otherNode) {
        if ((otherNode != node) && (otherNode.isSelected) && (otherNode.parent == undefined)) {
          otherNode.parent = node;
          otherNode.isSelected = false;
          self.arrRemove(self.selectedNodes, otherNode);
          ops.push(new GroupOperation(node, otherNode, self));
        }
      });
      self.selectNone();
      self.selectNode(node);
      self.addUndoLogEntry(ops);
      self.runLayout();
    };

    this.mergeNeighbours = function (node) {
      var neighbours = self.getNeighbours(node);
      var ops = [];
      neighbours.forEach(function (otherNode) {
        if ((otherNode != node) && (otherNode.parent == undefined)) {
          otherNode.parent = node;
          otherNode.isSelected = false;
          self.arrRemove(self.selectedNodes, otherNode);
          ops.push(new GroupOperation(node, otherNode, self));
        }
      });
      self.addUndoLogEntry(ops);
      self.runLayout();
    };

    this.mergeSelections = function (targetNode) {
      if (!targetNode) {
        console.log('Error - merge called on undefined target');
        return;
      }
      var selClone = self.selectedNodes.slice();
      var ops = [];
      selClone.forEach(function (otherNode) {
        if ((otherNode != targetNode) && (otherNode.parent == undefined)) {
          otherNode.parent = targetNode;
          otherNode.isSelected = false;
          self.arrRemove(self.selectedNodes, otherNode);
          ops.push(new GroupOperation(targetNode, otherNode, self));
        }
      });
      self.addUndoLogEntry(ops);
      self.runLayout();
    };

    this.ungroup = function (node) {
      var ops = [];
      self.nodes.forEach(function (other) {
        if (other.parent == node) {
          other.parent = undefined;
          ops.push(new UnGroupOperation(node, other, self));
        }
      });
      self.addUndoLogEntry(ops);
      self.runLayout();
    };

    this.unblacklist = function (node) {
      self.arrRemove(self.blacklistedNodes, node);
    };

    this.blacklistSelection = function () {
      var selection = self.getAllSelectedNodes();
      var danglingEdges = [];
      self.edges.forEach(function (edge) {
        if ((selection.indexOf(edge.source) >= 0) ||
              (selection.indexOf(edge.target) >= 0)) {
          delete self.edgesMap[edge.id];
          danglingEdges.push(edge);
        }
      });
      for (var n in selection) {
        var node = selection[n];
        delete self.nodesMap[node.id];
        self.blacklistedNodes.push(node);
        node.isSelected = false;
      }
      self.arrRemoveAll(self.nodes, selection);
      self.arrRemoveAll(self.edges, danglingEdges);
      self.selectedNodes = [];
      self.runLayout();

    };



    // A "simple search" operation that requires no parameters from the client.
    // Performs numHops hops pulling in field-specific number of terms each time
    this.simpleSearch = function (searchTerm, fieldsChoice, numHops) {
      if (!fieldsChoice) {
        fieldsChoice = self.options.vertex_fields;
      }
      var step = {};

      //Add any blacklisted nodes to exclusion list
      var excludeNodesByField = {};
      var nots = [];
      var avoidNodes = this.blacklistedNodes;
      for (var i = 0; i < avoidNodes.length; i++) {
        var n = avoidNodes[i];
        var arr = excludeNodesByField[n.data.field];
        if (!arr) {
          arr = [];
          excludeNodesByField[n.data.field] = arr;
        }
        arr.push(n.data.term);
        //Add to list of must_nots in guiding query
        var tq = {};
        tq[n.data.field] = n.data.term;
        nots.push({
          'term': tq
        });
      }

      var rootStep = step;
      for (var hopNum = 0; hopNum < numHops; hopNum++) {
        var arr = [];

        for (var f in fieldsChoice) {
          var field = fieldsChoice[f].name;
          var hopSize = fieldsChoice[f].hopSize;
          var excludes = excludeNodesByField[field];
          var stepField = {
            'field': field,
            'size': hopSize,
            'min_doc_count': parseInt(self.options.exploreControls.minDocCount)
          };
          if (excludes) {
            stepField.exclude = excludes;
          }
          arr.push(stepField);
        }
        step.vertices = arr;
        if (hopNum < (numHops - 1)) {
          // if (s < (stepSizes.length - 1)) {
          var nextStep = {};
          step.connections = nextStep;
          step = nextStep;
        }

      }
      var qs = {
        'query_string': {
          'query': searchTerm
        }
      };
      var query = qs;
      if (nots.length > 0) {
        query = {
          'bool': {
            'must': [qs],
            'must_not': nots
          }
        };
      }


      var request = {
        'query': query,
        'controls': self.buildControls(),
        'connections': rootStep.connections,
        'vertices': rootStep.vertices
      };
      self.callElasticsearch(request);

    };

    this.buildControls = function () {
      //This is an object managed by the client that may be subject to change
      var guiSettingsObj = self.options.exploreControls;

      var controls = {
        use_significance: guiSettingsObj.useSignificance,
        sample_size: guiSettingsObj.sampleSize,
        timeout: parseInt(guiSettingsObj.timeoutMillis)
      };
        // console.log("guiSettingsObj",guiSettingsObj);
      if (guiSettingsObj.sampleDiversityField != null) {
        controls.sample_diversity = {
          field: guiSettingsObj.sampleDiversityField.name,
          max_docs_per_value: guiSettingsObj.maxValuesPerDoc
        };
      }
      return controls;
    };

    this.makeNodeId = function (field, term) {
      return field + '..' + term;
    };

    //=======  Adds new nodes retrieved from an elasticsearch search ========
    this.mergeGraph = function (newData) {
      this.stopLayout();

      if (!newData.nodes) {
        newData.nodes = [];
      }
      var lastOps = [];

      // === Commented out - not sure it was obvious to users what various circle sizes meant
      // var minCircleSize = 5;
      // var maxCircleSize = 25;
      // var sizeScale = d3.scale.pow().exponent(0.15)
      //   .domain([0, d3.max(newData.nodes, function(d) {
      //     return d.weight;
      //   })])
      //   .range([minCircleSize, maxCircleSize]);

      //Remove nodes we already have
      var dedupedNodes = [];
      for (var o in newData.nodes) {
        var node = newData.nodes[o];
        //Assign an ID
        node.id = self.makeNodeId(node.field, node.term);
        if (!this.nodesMap[node.id]) {
          //Default the label
          node.label = node.term;
          dedupedNodes.push(node);
        }
      }
      if ((dedupedNodes.length > 0) && (this.options.nodeLabeller)) {
        // A hook for client code to attach labels etc to newly introduced nodes.
        this.options.nodeLabeller(dedupedNodes);
      }

      for (var o in dedupedNodes) {
        var dedupedNode = dedupedNodes[o];
        var label = dedupedNode.term;
        if (dedupedNode.label) {
          label = dedupedNode.label;
        }

        var node = {
          x: 1,
          y: 1,
          numChildren: 0,
          parent: undefined,
          isSelected: false,
          id: dedupedNode.id,
          label: label,
          color: dedupedNode.color,
          icon: dedupedNode.icon,
          data: dedupedNode
        };
          //        node.scaledSize = sizeScale(node.data.weight);
        node.scaledSize = 15;
        node.seqNumber = this.seqNumber++;
        this.nodes.push(node);
        lastOps.push(new AddNodeOperation(node, self));
        this.nodesMap[node.id] = node;
      }

      for (var o in newData.edges) {
        var edge = newData.edges[o];
        var src = newData.nodes[edge.source];
        var target = newData.nodes[edge.target];
        var id = src.id + '->' + target.id;
        if (src.id > target.id) {
          id = target.id + '->' + src.id;
        }
        edge.id = id;

        //Lookup the wrappers object that will hold display Info like x/y coordinates
        var srcWrapperObj = this.nodesMap[src.id];
        var targetWrapperObj = this.nodesMap[target.id];

        var existingEdge = this.edgesMap[id];
        if (existingEdge) {
          existingEdge.weight = Math.max(existingEdge.weight, edge.weight);
          //TODO update width too?
          existingEdge.doc_count = Math.max(existingEdge.doc_count, edge.doc_count);
          continue;
        }
        // Inferred edges were a feature that used Levenshtein edit distance on node labels
        // to determine connections - removed that feature but may bring back.

        var inferred = edge.inferred ? true : false;
        var newEdge = {
          'source': srcWrapperObj,
          'target': targetWrapperObj,
          'weight': edge.weight,
          'width': edge.width,
          'id': id,
          'doc_count': edge.doc_count,
          'inferred': inferred
        };
        this.edgesMap[newEdge.id] = newEdge;
        this.edges.push(newEdge);
        lastOps.push(new AddEdgeOperation(newEdge, self));
      }

      if (lastOps.length > 0) {
        self.addUndoLogEntry(lastOps);
      }

      this.runLayout();

    };

    this.mergeIds = function (parentId, childId) {
      var parent = self.getNode(parentId);
      var child = self.getNode(childId);
      if (child.isSelected) {
        child.isSelected = false;
        self.arrRemove(self.selectedNodes, child);
      }
      child.parent = parent;
      self.addUndoLogEntry([new GroupOperation(parent, child, self)]);
      self.runLayout();
    };

    this.getNode = function (nodeId) {
      return this.nodesMap[nodeId];
    };
    this.getEdge = function (edgeId) {
      return this.edgesMap[edgeId];
    };



    //======= Expand functions to request new additions to the graph

    this.expandSelecteds = function (clearExisting, targetOptions) {
      var startNodes = self.getAllSelectedNodes();
      if (startNodes.length == 0) {
        startNodes = self.nodes;
      }
      var clone = startNodes.slice();
      self.expand(clone, clearExisting, targetOptions);
    };

    this.expandGraph = function () {
      self.expandSelecteds(false, {
        valueTypes: 'new'
      });
    };


    //Add missing links between existing nodes
    this.fillInGraph = function () {
      self.expandSelecteds(false, {
        valueTypes: 'old'
      });
    };

    //Find new nodes to link to existing selected nodes
    this.expandNode = function (node) {
      self.expand(self.returnUnpackedGroupeds([node]), false, {
        valueTypes: 'new'
      });
    };

    // A manual expand function where the client provides the list
    // of existing nodes that are the start points and some options
    // about what targets are of interest.
    // Target choices are "new", "old" or "both"
    this.expand = function (startNodes, clearExisting, targetOptions) {
      //=============================
      if (clearExisting) {
        this.clearGraph();
      }
      var nodesByField = {};
      var excludeNodesByField = {};

      //Add any blacklisted nodes to exclusion list
      var avoidNodes = this.blacklistedNodes;
      for (var i = 0; i < avoidNodes.length; i++) {
        var n = avoidNodes[i];
        var arr = excludeNodesByField[n.data.field];
        if (!arr) {
          arr = [];
          excludeNodesByField[n.data.field] = arr;
        }
        if (arr.indexOf(n.data.term) < 0) {
          arr.push(n.data.term);
        }
      }

      if (targetOptions.valueTypes == 'new') {
        var allExistingNodes = this.nodes;
        for (var i = 0; i < allExistingNodes.length; i++) {
          var n = allExistingNodes[i];
          var arr = excludeNodesByField[n.data.field];
          if (!arr) {
            arr = [];
            excludeNodesByField[n.data.field] = arr;
          }
          arr.push(n.data.term);
        }
      } else if (targetOptions.valueTypes == 'both') {

        //Avoid all nodes already connected to start nodes
        // Issue: if start nodes are A and B and A is already linked to C
        // we will not find a B->C connection because C is excluded globally

        //Note: for the entity-building use case need to remove excludes caused by above...
        // (this comment likely means something profound but until I immerse myself in
        // entity-building logic again the significance is lost on me.... :-(   )
        var allExistingEdges = this.edges;
        for (var i = 0; i < allExistingEdges.length; i++) {
          var e = allExistingEdges[i];
          var n = null;
          if (startNodes.indexOf(e.source) >= 0) {
            n = e.target;
          }
          if (startNodes.indexOf(e.target) >= 0) {
            n = e.source;
          }
          if (n != null) {
            var arr = excludeNodesByField[n.data.field];
            if (!arr) {
              arr = [];
              excludeNodesByField[n.data.field] = arr;
            }
            if (arr.indexOf(n.data.term) < 0) {
              arr.push(n.data.term);
            }
          }
        }
      }


      //Organize nodes by field
      for (var i = 0; i < startNodes.length; i++) {
        var n = startNodes[i];
        var arr = nodesByField[n.data.field];
        if (!arr) {
          arr = [];
          nodesByField[n.data.field] = arr;
        }
        // pushing boosts server-side to influence sampling/direction
        arr.push({
          'term': n.data.term,
          'boost': n.data.weight
        });

        var arr = excludeNodesByField[n.data.field];
        if (!arr) {
          arr = [];
          excludeNodesByField[n.data.field] = arr;
        }
        //NOTE for the entity-building use case need to remove excludes that otherwise
        // prevent bridge-building.
        if (targetOptions.valueTypes == 'new') {
          if (arr.indexOf(n.data.term) < 0) {
            arr.push(n.data.term);
          }
        }
      }


      var primaryVertices = [];
      var secondaryVertices = [];
      for (var fieldName in nodesByField) {
        primaryVertices.push({
          'field': fieldName,
          'include': nodesByField[fieldName],
          'min_doc_count': parseInt(self.options.exploreControls.minDocCount)
        });
      }

      var targetFields = this.options.vertex_fields;
      if (targetOptions.toFields) {
        targetFields = targetOptions.toFields;
      }

      //Identify target fields
      for (var f in targetFields) {
        var fieldName = targetFields[f].name;
        var hopSize = targetFields[f].hopSize;

        var fieldHop = {
          'field': fieldName,
          'size': hopSize,
          'min_doc_count': parseInt(self.options.exploreControls.minDocCount)
        };
        if (targetOptions.valueTypes == 'old') {
          //Look to reinforce internal links for ANY of the existing terms
          fieldHop.include = self.nodes.filter(function (n) {
            return n.data.field == fieldName;
          }).map(function (n) {
            return n.data.term;
          });
          if (fieldHop.include.length == 0) {
            //There are no old nodes to connect to - remove this from the graph request
            continue;
          }
        } else {
          fieldHop.exclude = excludeNodesByField[fieldName];
        }
        secondaryVertices.push(fieldHop);

      }

      var request = {
        'controls': self.buildControls(),
        'vertices': primaryVertices,
        'connections': {
          'vertices': secondaryVertices
        }
      };

      if (targetOptions.valueTypes == 'old') {
        // Looking for connections between the provided nodes.
        // We need to ensure we select in the sample docs that contain pairings of nodes
        // - add a query that enforces this.
        var shoulds = [];
        for (var bs in startNodes) {
          var node = startNodes[bs];
          if (node.parent == undefined) {
            shoulds.push(self.buildNodeQuery(node));
          }
        }
        request.query = {
          'bool': {
            'minimum_number_should_match': 2,
            'should': shoulds
          }
        };
      }



      self.lastRequest = JSON.stringify(request, null, '\t');
      graphExplorer(self.options.indexName, request, function (data) {
        self.lastResponse = JSON.stringify(data, null, '\t');
        var nodes = [];
        var edges = [];

        //Label fields with a field number for CSS styling
        for (var n in data.vertices) {
          var node = data.vertices[n];
          for (var f in targetFields) {
            var fieldDef = targetFields[f];
            if (node.field == fieldDef.name) {
              node.color = fieldDef.color;
              node.icon = fieldDef.icon;
              node.fieldDef = fieldDef;
              break;
            }
          }
        }

        // Size the edges based on the maximum weight
        var minLineSize = 2;
        var maxLineSize = 10;
        var maxEdgeWeight = 0.00000001;
        for (var e in data.connections) {
          var edge = data.connections[e];
          maxEdgeWeight = Math.max(maxEdgeWeight, edge.weight);
        }
        for (var e in data.connections) {
          var edge = data.connections[e];
          edges.push({
            source: edge.source,
            target: edge.target,
            doc_count: edge.doc_count,
            weight: edge.weight,
            width: Math.max(minLineSize, ((edge.weight / maxEdgeWeight) * maxLineSize))
          });
        }

        //TODO Deal with deficiency of back-end API here - currently no
        // way to ask for more connections but exclude edges we already have
        // in the client workspace - (we can only include/exclude individual nodes).
        // Consequently when adding edges to existing nodes ("old" expand mode) we
        // ask for all edges with 2 pairs of include statements and return ALL edges.
        // This function trims the excess of edges.
        if (targetOptions.valueTypes == 'old') {
          edges = self.trimExcessNewEdges(data.vertices, edges);
        }



        // Add the new nodes and edges into the existing workspace's graph
        self.mergeGraph({
          'nodes': data.vertices,
          'edges': edges
        });

      });
      //===== End expand graph ========================

    };

    this.trimExcessNewEdges = function (newNodes, newEdges) {
      var trimmedEdges = [];
      var maxNumEdgesToReturn = 5;
      //Trim here to just the new edges that are most interesting.
      for (var o in newEdges) {
        var edge = newEdges[o];
        var src = newNodes[edge.source];
        var target = newNodes[edge.target];
        var srcId = src.field + '..' + src.term;
        var targetId = target.field + '..' + target.term;
        var id = srcId + '->' + targetId;
        if (srcId > targetId) {
          var id = targetId + '->' + srcId;
        }
        var existingSrcNode = self.nodesMap[srcId];
        var existingTargetNode = self.nodesMap[targetId];
        if (existingSrcNode != null && existingTargetNode != null) {
          if (existingSrcNode.parent != undefined && existingTargetNode.parent != undefined) {
            // both nodes are rolled-up and grouped so this edge would not be a visible
            // change to the graph - lose it in favour of any other visible ones.
            continue;
          }
        } else {
          console.log('Error? Missing nodes ' + srcId + ' or ' + targetId, self.nodesMap);
          continue;
        }

        var existingEdge = self.edgesMap[id];
        if (existingEdge) {
          existingEdge.weight = Math.max(existingEdge.weight, edge.weight);
          existingEdge.doc_count = Math.max(existingEdge.doc_count, edge.doc_count);
          continue;
        } else {
          trimmedEdges.push(edge);
        }
      }
      if (trimmedEdges.length > maxNumEdgesToReturn) {
        //trim to only the most interesting ones
        trimmedEdges.sort(function (a, b) {
          return b.weight - a.weight;
        });
        trimmedEdges = trimmedEdges.splice(0, maxNumEdgesToReturn);
      }
      return trimmedEdges;
    };

    this.getSelectionsExampleDocs = function (completedHandler) {
      self.getExampleDocs(self.selectedNodes, completedHandler);
    };




    // TODO - this used to be part of some in-built document visualization
    // but ideally should be handled by calling saved Kibana visualizations.
    // The query-building parts of this function will be useful for this
    this.getExampleDocs = function (startNodes, completedHandler) {
      var shoulds = [];
      for (var bs in startNodes) {
        var node = startNodes[bs];
        if (node.parent == undefined) {
          shoulds.push(self.buildNodeQuery(node));
        }
      }
      var query = {
        'bool': {
          'should': shoulds
        }
      };

      var request = {
        'query': query,
        'size': 0,
        'aggs': {
          'sample': {
            'sampler': {

            },
            'aggs': {
              'topHits': {
                'top_hits': {
                  'size': 10
                }
              }
            }
          }
        }
      };

      var controls = self.buildControls();
      if (controls.sample_diversity) {
        request.aggs.sample.sampler.max_docs_per_value = parseInt(controls.sample_diversity.max_docs_per_value);
        request.aggs.sample.sampler.field = controls.sample_diversity.field;
      }

      var dataForServer = JSON.stringify(request);
      searcher(self.options.indexName, request, function (data) {
        var exampleDocs = [];

        var hits = data.aggregations.sample.topHits.hits.hits;
        if (completedHandler) {
          completedHandler(hits);
        }
      });
    };



    this.getSelectedIntersections = function (callback) {
      if (self.selectedNodes.length == 0) {
        return self.getAllIntersections(callback, self.nodes);
      }
      if (self.selectedNodes.length == 1) {
        var selectedNode = self.selectedNodes[0];
        var neighbourNodes = self.getNeighbours(selectedNode);
        neighbourNodes.push(selectedNode);
        return self.getAllIntersections(callback, neighbourNodes);
      }
      return self.getAllIntersections(callback, self.getAllSelectedNodes());
    };

    this.JLHScore = function (subsetFreq, subsetSize, supersetFreq, supersetSize) {
      var subsetProbability = subsetFreq / subsetSize;
      var supersetProbability = supersetFreq / supersetSize;

      var absoluteProbabilityChange = subsetProbability - supersetProbability;
      if (absoluteProbabilityChange <= 0) {
        return 0;
      }
      var relativeProbabilityChange = (subsetProbability / supersetProbability);
      return absoluteProbabilityChange * relativeProbabilityChange;
    };



    // Currently unused in the Kibana UI. It was a utility that provided a sorted list
    // of recommended node merges for a selection of nodes. Top results would be
    // rare nodes that ALWAYS appear alongside more popular ones e.g. text:9200 always
    // appears alongside hashtag:elasticsearch so would be offered as a likely candidate
    // for merging.

    // Determines union/intersection stats for neighbours of a node.
    // TODO - could move server-side as a graph API function?
    this.getAllIntersections = function (callback, nodes) {
      //Ensure these are all top-level nodes only
      nodes = nodes.filter(function (n) {
        return n.parent == undefined;
      });

      var allQueries = nodes.map(function (node) {
        return self.buildNodeQuery(node);
      });

      var allQuery = {
        'bool': {
          'should': allQueries
        }
      };
        //====================
      var request = {
        'query': allQuery,
        'size': 0,
        'aggs': {
          'all': {
            'global': {}
          },
          'sources': {
            // Could use significant_terms not filters to get stats but
            // for the fact some of the nodes are groups of terms.
            'filters': {
              'filters': {}
            },
            'aggs': {
              'targets': {
                'filters': {
                  'filters': {

                  }
                }
              }
            }
          }
        }
      };
      for (var n in allQueries) {
        // Add aggs to get intersection stats with root node.
        request.aggs.sources.filters.filters['bg' + n] = allQueries[n];
        request.aggs.sources.aggs.targets.filters.filters['fg' + n] = allQueries[n];
      }
      var dataForServer = JSON.stringify(request);
      searcher(self.options.indexName, request, function (data) {
        var termIntersects = [];
        var fullDocCounts = [];
        var allDocCount = data.aggregations.all.doc_count;

        // Gather the background stats for all nodes.
        for (var n in nodes) {
          fullDocCounts.push(data.aggregations.sources.buckets['bg' + n].doc_count);
        }
        for (var n in nodes) {
          var rootNode = nodes[n];
          var t1 = fullDocCounts[n];
          var baseAgg = data.aggregations.sources.buckets['bg' + n].targets.buckets;
          for (var l in nodes) {
            var t2 = fullDocCounts[l];
            var leafNode = nodes[l];
            if (l == n) {
              continue;
            }
            if (t1 > t2) {
              // We should get the same stats for t2->t1 from the t1->t2 bucket path
              continue;
            }
            if (t1 == t2) {
              if (rootNode.id > leafNode.id) {
                // We should get the same stats for t2->t1 from the t1->t2 bucket path
                continue;
              }
            }
            var t1AndT2 = baseAgg['fg' + l].doc_count;
            if (t1AndT2 == 0) {
              continue;
            }
            var neighbourNode = nodes[l];
            var t1Label = rootNode.data.label;
            if (rootNode.numChildren > 0) {
              t1Label += '(+' + rootNode.numChildren + ')';
            }
            var t2Label = neighbourNode.data.label;
            if (neighbourNode.numChildren > 0) {
              t2Label += '(+' + neighbourNode.numChildren + ')';
            }

            // A straight percentage can be poor if t1==1 (100%) - not too much strength of evidence
            //  var mergeConfidence=t1AndT2/t1;

            // So using Significance heuristic instead
            var mergeConfidence = self.JLHScore(t1AndT2, t2, t1, allDocCount);

            var termIntersect = {
              id1: rootNode.id,
              id2: neighbourNode.id,
              term1: t1Label,
              term2: t2Label,
              v1: t1,
              v2: t2,
              mergeLeftConfidence: (t1AndT2 / t1),
              mergeRightConfidence: (t1AndT2 / t2),
              'mergeConfidence': mergeConfidence,
              overlap: t1AndT2
            };
            termIntersects.push(termIntersect);
          }
        }
        termIntersects.sort(function (a, b) {
          if (b.mergeConfidence != a.mergeConfidence) {
            return b.mergeConfidence - a.mergeConfidence;
          }
          // If of equal similarity use the size of the overlap as
          // a measure of magnitude/significance for tie-breaker.

          if (b.overlap != a.overlap) {
            return b.overlap - a.overlap;
          }
          //All other things being equal we now favour where t2 NOT t1 is small.
          return a.v2 - b.v2;
        });
        if (callback) {
          callback(termIntersects);
        }

      });
    };

    // Internal utility function for calling the Graph API and handling the response
    // by merging results into existing nodes in this workspace.
    this.callElasticsearch = function (request) {
      self.lastRequest = JSON.stringify(request, null, '\t');
      graphExplorer(self.options.indexName, request, function (data) {
        self.lastResponse = JSON.stringify(data, null, '\t');
        var nodes = [];
        var edges = [];
        //Label the nodes with field number for CSS styling
        for (var n in data.vertices) {
          var node = data.vertices[n];
          for (var f in self.options.vertex_fields) {
            var fieldDef = self.options.vertex_fields[f];
            if (node.field == fieldDef.name) {
              node.color = fieldDef.color;
              node.icon = fieldDef.icon;
              node.fieldDef = fieldDef;
              break;
            }
          }
        }

        //Size the edges depending on weight
        var minLineSize = 2;
        var maxLineSize = 10;
        var maxEdgeWeight = 0.00000001;
        for (var e in data.connections) {
          var edge = data.connections[e];
          maxEdgeWeight = Math.max(maxEdgeWeight, edge.weight);

        }
        for (var e in data.connections) {
          var edge = data.connections[e];
          edges.push({
            source: edge.source,
            target: edge.target,
            doc_count: edge.doc_count,
            weight: edge.weight,
            width: Math.max(minLineSize, ((edge.weight / maxEdgeWeight) * maxLineSize))
          });
        }

        self.mergeGraph({
          'nodes': data.vertices,
          'edges': edges
        }, {
          'labeller': self.options.labeller
        });

      });
    };


  }
  //=====================

  // Begin Kibana wrapper
  return {
    'createWorkspace': createWorkspace
  };

}());
