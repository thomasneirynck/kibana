import d3 from 'd3';
import { venn } from 'venn.js';
import 'ace';
import './angular-venn-simple.js';
import gws from './graphClientWorkspace.js';
import utils from './utils.js';
import { capitalize, partial } from 'lodash';
import IndexPatternsProvider from 'ui/index_patterns/index_patterns';

import 'ui/autoload/all';
import 'ui/directives/saved_object_finder';
import SavedWorkspacesProvider from 'plugins/graph/services/saved_workspaces';
import {iconChoices, colorChoices, iconChoicesByClass} from 'plugins/graph/style_choices';

import KbnUrlProvider from 'ui/url';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import chrome from 'ui/chrome';
import 'plugins/graph/less/main.less';
import uiModules from 'ui/modules';
import uiRoutes from 'ui/routes';
import uiNotify from 'ui/notify';
import Notifier from 'ui/notify/notifier';
import appTemplate from 'plugins/graph/templates/index.html';

var app = uiModules.get('app/graph', ['angular-venn-simple']);

function checkLicense(Private, Promise) {
  const xpackInfo = Private(XPackInfoProvider);

  const licenseAllowsToShowThisPage = xpackInfo.get('features.graph.showAppLink') && xpackInfo.get('features.graph.enableAppLink');
  if (!licenseAllowsToShowThisPage) {
    const message = xpackInfo.get('features.graph.message');
    const queryString = `?${Notifier.QS_PARAM_LOCATION}=Graph&${Notifier.QS_PARAM_LEVEL}=error&${Notifier.QS_PARAM_MESSAGE}=${message}`;
    const url = `${chrome.addBasePath('/app/kibana')}#${queryString}`;

    window.location.href = url;
    return Promise.halt();
  }

  return Promise.resolve();
}

app.run(checkLicense);

app.directive('focusOn', function () {
  return function (scope, elem, attr) {
    scope.$on(attr.focusOn, function (e) {
      elem[0].focus();
    });
  };
});


if (uiRoutes.enable) {
  uiRoutes.enable();
}

uiRoutes
  .when('/home', {
    template: appTemplate,
    resolve: {
      GetIndexPatternIds: function (Private) {
        const indexPatterns = Private(IndexPatternsProvider);
        return indexPatterns.getIds();
      },
      GetIndexPatternProvider: function (Private) {
        return Private(IndexPatternsProvider);
      },
      SavedWorkspacesProvider: function (Private) {
        return Private(SavedWorkspacesProvider);
      }

    }
  })
  .when('/workspace/:id', {
    template: appTemplate,
    resolve: {
      savedWorkspace: function (savedGraphWorkspaces, courier, $route) {
        return savedGraphWorkspaces.get($route.current.params.id)
        .catch(
          function () {
            require('ui/notify').error('Missing workspace');
          }
      );

      },
      GetIndexPatternIds: function (Private) {
        const indexPatterns = Private(IndexPatternsProvider);
        return indexPatterns.getIds();
      },
      GetIndexPatternProvider: function (Private) {
        return Private(IndexPatternsProvider);
      },
      SavedWorkspacesProvider: function (Private) {
        return Private(SavedWorkspacesProvider);
      }
    }
  })
  .otherwise({
    redirectTo: '/home'
  });


//========  Controller for basic UI ==================
app.controller('graphuiPlugin', function ($scope, $route, $interval, $http, kbnUrl, Private, Promise) {

  function handleSuccess(data) {
    return checkLicense(Private, Promise)
    .then(() => data);
  }

  function handleError(err) {
    return checkLicense(Private, Promise)
    .then(() => uiNotify.error(err));
  }

  $scope.title = 'Graph';
  $scope.spymode = 'request';

  $scope.iconChoices = iconChoices;
  $scope.colors = colorChoices;
  $scope.iconChoicesByClass = iconChoicesByClass;

  $scope.fields = [];

  $scope.graphSavePolicy = chrome.getInjected('graphSavePolicy');
  $scope.allSavingDisabled = $scope.graphSavePolicy === 'none';
  $scope.searchTerm = '';

  // Because grrrrr http://stackoverflow.com/questions/12618342/ng-model-does-not-update-controller-value
  $scope.grr = $scope;

  //Updates styling on all nodes in the UI that use this field
  $scope.applyColor = function (fieldDef, color) {
    fieldDef.color = color;
    if ($scope.workspace) {
      $scope.workspace.nodes.forEach(function (node) {
        if (node.data.field === fieldDef.name) {
          node.color = color;
        }
      });
    }
  };

  //Updates styling on all nodes in the UI that use this field
  $scope.applyIcon = function (fieldDef, icon) {
    fieldDef.icon = icon;
    if ($scope.workspace) {
      $scope.workspace.nodes.forEach(function (node) {
        if (node.data.field === fieldDef.name) {
          node.icon = icon;
        }
      });
    }
  };

  $scope.openSavedWorkspace = function (savedWorkspace) {
    kbnUrl.change('/workspace/{{id}}', {id: savedWorkspace.id});
  };


  $scope.nodeClick = function (n, $event) {

    //Selection logic - shift key+click helps selects multiple nodes
    // Without the shift key we deselect all prior selections (perhaps not
    // a great idea for touch devices with no concept of shift key)
    if (!$event.shiftKey) {
      var prevSelection = n.isSelected;
      $scope.workspace.selectNone();
      n.isSelected = prevSelection;
    }


    if ($scope.workspace.toggleNodeSelection(n)) {
      $scope.selectSelected(n);
    } else {
      $scope.detail = null;
    }
  };


  //A live response field is one that is both selected and actively enabled for returning in responses
  // We call this function to refresh the array whenever there is a change in the conditions.
  $scope.updateLiveResponseFields = function () {
    $scope.liveResponseFields = $scope.selectedFields.filter(function (fieldDef) {
      return (fieldDef.hopSize > 0) && fieldDef.selected;
    });
  };

  $scope.selectedFieldConfigHopSizeChanged = function () {
    // Only vertex fields with hop size > 0 are deemed "live"
    // so when there is a change we re-evaluate the list of live fields
    $scope.updateLiveResponseFields();
  };

  $scope.hideAllConfigPanels = function () {
    $scope.selectedFieldConfig = null;
    $scope.kbnTopNav.close();
  };

  $scope.setAllFieldStatesToDefault = function () {
    $scope.selectedFields = [];
    $scope.basicModeSelectedSingleField = null;
    $scope.liveResponseFields = [];

    // Default field state is not selected
    $scope.allFields.forEach(function (fieldDef) {
      fieldDef.selected = false;
    });
  };

  $scope.addFieldToSelection =  function () {
    $scope.selectedField.selected = true;
    if ($scope.selectedFields.indexOf($scope.selectedField) < 0) {
      $scope.selectedFields.push($scope.selectedField);
    }
    $scope.updateLiveResponseFields();
    //Force load of the config panel for the field
    $scope.clickVertexFieldIcon($scope.selectedField);
  };

  $scope.clickVertexFieldIcon = function (field, $event) {
    // Shift click is a fast way to toggle if the field is active or not.
    if ($event && field) {
      if ($event.shiftKey) {
        if (field.hopSize === 0) {
          field.hopSize = field.lastValidHopSize ? field.lastValidHopSize : 5;
        }else {
          field.lastValidHopSize = field.hopSize;
          field.hopSize = 0;
        }
        $scope.updateLiveResponseFields();
        return;
      }
    }

    // Check if user is toggling off an already-open config panel for the current field
    if ($scope.kbnTopNav.currentKey === 'fieldConfig' && field === $scope.selectedFieldConfig) {
      $scope.hideAllConfigPanels();
      return;
    }
    $scope.hideAllConfigPanels();
    $scope.selectedFieldConfig = field;
    $scope.kbnTopNav.currentKey = 'fieldConfig';
  };

  $scope.uiSelectIndex = function () {
    if ($scope.canWipeWorkspace()) {
      $scope.indexSelected($scope.proposedIndex);
    }else {
      $scope.proposedIndex = $scope.selectedIndex;
    }
  };

  $scope.canWipeWorkspace = function () {
    return (($scope.selectedFields.length === 0 && $scope.workspace === null) ||
        confirm('This will clear the workspace - are you sure?'));
  };

  $scope.indexSelected = function (selectedIndex, postInitHandler) {
    $scope.clearWorkspace();
    $scope.allFields = [];
    $scope.selectedFields = [];
    $scope.basicModeSelectedSingleField = null;
    $scope.selectedField = null;
    $scope.selectedFieldConfig = null;
    $scope.selectedIndex = selectedIndex;
    $scope.proposedIndex = selectedIndex;

    var promise = $route.current.locals.GetIndexPatternProvider.get(selectedIndex);
    promise
    .then(handleSuccess)
    .then(function (indexPattern) {
      var patternFields = indexPattern.getNonScriptedFields();
      var blockedFieldNames = ['_id', '_index','_score','_source', '_type'];
      patternFields.forEach(function (field, index) {
        if (blockedFieldNames.indexOf(field.name) >= 0) {
          return;
        }
        var graphFieldDef = {
          'name': field.name
        };
        $scope.allFields.push(graphFieldDef);
        graphFieldDef.hopSize = 5; //Default the number of results returned per hop
        graphFieldDef.lastValidHopSize = graphFieldDef.hopSize;
        graphFieldDef.icon = $scope.iconChoices[0];
        for (var i = 0; i < $scope.iconChoices.length; i++) {
          var icon = $scope.iconChoices[i];
          for (var p = 0; p < icon.patterns.length; p++) {
            var pattern = icon.patterns[p];
            if (pattern.test(graphFieldDef.name)) {
              graphFieldDef.icon = icon;
              break;
            }
          }
        }
        graphFieldDef.color = $scope.colors[index % $scope.colors.length];
      });
      $scope.setAllFieldStatesToDefault();

      $scope.allFields.sort(function (a, b) {
        // TODO - should we use "popularity" setting from index pattern definition?
        // What is its intended use? Couldn't see it on the patternField objects
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        }
        return 0;
      });
      $scope.filteredFields = $scope.allFields;
      if ($scope.allFields.length > 0) {
        $scope.selectedField = $scope.allFields[0];
      }


      if (postInitHandler) {
        postInitHandler();
      }

    }, handleError);

  };


  $scope.clickEdge = function (edge) {
    if (edge.inferred) {
      $scope.setDetail ({'inferredEdge':edge});
    }else {
      $scope.workspace.getAllIntersections($scope.handleMergeCandidatesCallback, [edge.topSrc,edge.topTarget]);
    }
  };

  // Replacement function for graphClientWorkspace's comms so
  // that it works with Kibana.
  function callNodeProxy(indexName, query, responseHandler) {
    var request = {
      index: indexName,
      query: query
    };
    return $http.post('../api/graph/graphExplore', request)
      .then(function (resp) {
        if (resp.data.resp.timed_out) {
          uiNotify.warning('Exploration timed out');
        }
        responseHandler(resp.data.resp);
      })
      .catch(handleError);
  }


  //Helper function for the graphClientWorkspace to perform a query
  var callSearchNodeProxy = function (indexName, query, responseHandler) {
    var request = {
      index: indexName,
      body: query
    };
    $http.post('../api/graph/searchProxy', request)
      .then(function (resp) {
        responseHandler(resp.data.resp);
      })
      .catch(handleError);
  };

  $scope.submit = function () {
    $scope.hideAllConfigPanels();
    initWorkspaceIfRequired();
    var numHops = 2;
    if ($scope.searchTerm.startsWith('{')) {
      try {
        var query = JSON.parse($scope.searchTerm);
        if (query.vertices) {
          // Is a graph explore request
          $scope.workspace.callElasticsearch(query);
        }else {
          // Is a regular query DSL query
          $scope.workspace.search(query, $scope.liveResponseFields, numHops);
        }
      }
      catch (err) {
        handleError(err);
      }
      return;
    }
    $scope.workspace.simpleSearch($scope.searchTerm, $scope.liveResponseFields, numHops);
  };

  $scope.clearWorkspace = function () {
    $scope.workspace = null;
    $scope.detail = null;
    if ($scope.kbnTopNav) {
      $scope.kbnTopNav.close();
    }
  };

  $scope.toggleShowAdvancedFieldsConfig = function () {
    if ($scope.kbnTopNav.currentKey !== 'fields') {
      $scope.kbnTopNav.close();
      $scope.kbnTopNav.currentKey = 'fields';
      //Default the selected field
      $scope.selectedField = null;
      $scope.filteredFields = $scope.allFields.filter(function (fieldDef) {
        return !fieldDef.selected;
      });
      if ($scope.filteredFields.length > 0) {
        $scope.selectedField = $scope.filteredFields[0];
      }
    } else {
      $scope.hideAllConfigPanels();
    }
  };

  $scope.removeVertexFieldSelection = function () {
    $scope.selectedFieldConfig.selected = false;
    // Find and remove field from array (important not to just make a new filtered array because
    // this array instance is shared with $scope.workspace)
    var i = $scope.selectedFields.indexOf($scope.selectedFieldConfig);
    if (i !== -1) {
      $scope.selectedFields.splice(i, 1);
    }
    $scope.updateLiveResponseFields();
    $scope.hideAllConfigPanels();
  };

  $scope.selectSelected = function (node) {
    $scope.detail = {
      latestNodeSelection: node
    };
    return $scope.selectedSelectedVertex = node;
  };

  $scope.isSelectedSelected = function (node) {
    return $scope.selectedSelectedVertex === node;
  };

  $scope.filterFieldsKeyDown = function (event) {
    const lcFilter = $scope.fieldNamesFilterString.toLowerCase();
    $scope.filteredFields = $scope.allFields.filter(function (fieldDef) {
      return !fieldDef.selected && (!lcFilter || lcFilter === ''
      || fieldDef.name.toLowerCase().indexOf(lcFilter) >= 0);
    });
  };

  $scope.resetWorkspace = function () {
    $scope.clearWorkspace();
    $scope.userHasConfirmedSaveWorkspaceData = false;
    $scope.selectedIndex = null;
    $scope.proposedIndex = null;
    $scope.detail = null;
    $scope.selectedSelectedVertex = null;
    $scope.selectedField = null;
    $scope.description = null;
    $scope.allFields = [];

    $scope.fieldNamesFilterString = null;
    $scope.filteredFields = [];

    $scope.selectedFields = [];
    $scope.configPanel = 'settings';
    $scope.liveResponseFields = [];

    $scope.exploreControls = {
      useSignificance: true,
      sampleSize: 2000,
      timeoutMillis: 5000,
      sampleDiversityField: null,
      maxValuesPerDoc: 1,
      minDocCount: 3
    };
  };


  function initWorkspaceIfRequired() {
    if ($scope.workspace) {
      return;
    }
    var options = {
      indexName: $scope.selectedIndex,
      vertex_fields: $scope.selectedFields,
      // Here we have the opportunity to look up labels for nodes...
      nodeLabeller: function (newNodes) {
        //   console.log(newNodes);
      },
      changeHandler: function () {
        //Allows DOM to update with graph layout changes.
        $scope.$apply();
      },
      graphExploreProxy: callNodeProxy,
      searchProxy: callSearchNodeProxy,
      exploreControls: $scope.exploreControls
    };
    $scope.workspace = gws.createWorkspace(options);
    $scope.detail = null;
  }

  $scope.indices = $route.current.locals.GetIndexPatternIds;

  $scope.setDetail = function (data) {
    $scope.detail = data;
  };

  $scope.performMerge = function (parentId, childId) {
    var found = true;
    while (found) {
      found = false;
      for (var i in $scope.detail.mergeCandidates) {
        var mc = $scope.detail.mergeCandidates[i];
        if ((mc.id1 === childId) || (mc.id2 === childId)) {
          $scope.detail.mergeCandidates.splice(i, 1);
          found = true;
          break;
        }
      }
    }
    $scope.workspace.mergeIds(parentId, childId);
    $scope.detail = null;
  };


  $scope.handleMergeCandidatesCallback = function (termIntersects) {
    $scope.detail = {
      'mergeCandidates': utils.getMergeSuggestionObjects(termIntersects)
    };
  };

  // Zoom functions for the SVG-based graph
  var redraw = function () {
    d3.select('#svgRootGroup')
      .attr('transform',
        'translate(' + d3.event.translate + ')' + 'scale(' + d3.event.scale + ')')
      .attr('style', 'stroke-width: ' + 1 / d3.event.scale);
    //To make scale-dependent features possible....
    if ($scope.zoomLevel !== d3.event.scale) {
      $scope.zoomLevel = d3.event.scale;
      $scope.$apply();
    }
  };

  //initialize all the state
  $scope.resetWorkspace();


  var blockScroll = function () {
    d3.event.preventDefault();
  };
  d3.select('#graphSvg')
    .on('mousewheel', blockScroll)
    .on('DOMMouseScroll', blockScroll)
    .call(d3.behavior.zoom()
      .on('zoom', redraw));



  if ($scope.indices.length === 0) {
    uiNotify.warning('Oops, no data sources. First head over to Kibana settings and define a choice of index pattern');
  }


  // ===== Menubar configuration =========
  $scope.topNavMenu = [];
  $scope.topNavMenu.push({
    key: 'new',
    description: 'New Workspace',
    tooltip: 'Create a new workspace',
    run: function () { if ($scope.canWipeWorkspace()) {kbnUrl.change('/home', {}); } },
  });
  if (!$scope.allSavingDisabled) {
    $scope.topNavMenu.push({
      key: 'save',
      description: 'Save Workspace',
      tooltip: 'Save this workspace',
      disableButton: function () {return $scope.selectedFields.length === 0;},
      template: require('plugins/graph/templates/save_workspace.html')
    });
  }else {
    $scope.topNavMenu.push({
      key: 'save',
      description: 'Save Workspace',
      tooltip: 'No changes to saved workspaces are permitted by the current save policy',
      disableButton: true
    });
  }
  $scope.topNavMenu.push({
    key: 'open',
    description: 'Load Saved Workspace',
    tooltip: 'Load a saved workspace',
    template: require('plugins/graph/templates/load_workspace.html')
  });
  if (!$scope.allSavingDisabled) {
    $scope.topNavMenu.push({
      key: 'delete',
      disableButton: function () {return $route.current.locals.savedWorkspace === undefined;},
      description: 'Delete Saved Workspace',
      tooltip: 'Delete this workspace',
      run: function () {
        var title = $route.current.locals.savedWorkspace.title;
        if (confirm('Are you sure you want to delete the workspace ' + title + ' ?')) {
          $route.current.locals.SavedWorkspacesProvider.delete($route.current.locals.savedWorkspace.id);
          kbnUrl.change('/home', {});
          require('ui/notify').info('Deleted ' + title);
        }
      }
    });
  }else {
    $scope.topNavMenu.push({
      key: 'delete',
      disableButton: true,
      description: 'Delete Saved Workspace',
      tooltip: 'No changes to saved workspaces are permitted by the current save policy'
    });
  }
  $scope.topNavMenu.push({
    key: 'settings',
    disableButton: function () { return $scope.selectedIndex === null; },
    description: 'Settings',
    template: require('plugins/graph/templates/settings.html')
  });


  // Deal with situation of request to open saved workspace
  if ($route.current.locals.savedWorkspace) {

    var wsObj = JSON.parse($route.current.locals.savedWorkspace.wsState);
    $scope.savedWorkspace = $route.current.locals.savedWorkspace;
    $scope.description = $route.current.locals.savedWorkspace.description;


    $scope.indexSelected(wsObj.indexPattern, function () {
      Object.assign($scope.exploreControls, wsObj.exploreControls);


      for (var i in wsObj.selectedFields) {
        var savedField = wsObj.selectedFields[i];
        for (var f in $scope.allFields) {
          var field = $scope.allFields[f];
          if (savedField.name === field.name) {
            field.hopSize = savedField.hopSize;
            field.lastValidHopSize = savedField.lastValidHopSize;
            field.color = savedField.color;
            field.icon = $scope.iconChoicesByClass[savedField.iconClass];
            field.selected = true;
            $scope.selectedFields.push(field);
            break;
          }
        }
          //TODO what if field name no longer exists as part of the index-pattern definition?
      }

      $scope.updateLiveResponseFields();
      initWorkspaceIfRequired();
      var graph = {
        nodes:[],
        edges:[]
      };
      for (var i in wsObj.vertices) {
        var vertex = wsObj.vertices[i];
        var node = {
          field:vertex.field,
          term:vertex.term,
          label:vertex.label,
          color : vertex.color,
          icon : $scope.allFields.filter(function (fieldDef) {
            return vertex.field === fieldDef.name;
          })[0].icon,
          data : {}
        };
        graph.nodes.push(node);
      }
      for (var i in wsObj.blacklist) {
        var vertex = wsObj.blacklist[i];
        var fieldDef = $scope.allFields.filter(function (fieldDef) {
          return vertex.field === fieldDef.name;
        })[0];
        if (fieldDef) {
          var node = {
            field:vertex.field,
            term:vertex.term,
            label:vertex.label,
            color : vertex.color,
            icon : fieldDef.icon,
            data : {
              field:vertex.field,
              term:vertex.term
            }
          };
          $scope.workspace.blacklistedNodes.push(node);
        }
      }
      for (var i in wsObj.links) {
        var link = wsObj.links[i];
        graph.edges.push({
          source: link.source,
          target: link.target,
          inferred: link.inferred,
          label: link.label,
          term: vertex.term,
          width : link.width,
          weight : link.weight
        });
      }


      $scope.workspace.mergeGraph(graph);

      // Wire up parents and children
      for (var i in wsObj.vertices) {
        var vertex = wsObj.vertices[i];
        var vId = $scope.workspace.makeNodeId(vertex.field, vertex.term);
        var visNode = $scope.workspace.nodesMap[vId];
        // Default the positions.
        visNode.x = vertex.x;
        visNode.y = vertex.y;
        if (vertex.parent !== null) {
          var parentSavedObj = graph.nodes[vertex.parent];
          var parentId = $scope.workspace.makeNodeId(parentSavedObj.field, parentSavedObj.term);
          visNode.parent = $scope.workspace.nodesMap[parentId];
        }
      }
      $scope.workspace.runLayout();

    });
  }else {
    $route.current.locals.SavedWorkspacesProvider.get().then(function (newWorkspace) {
      $scope.savedWorkspace = newWorkspace;
    });
  }

  $scope.saveWorkspace = function () {
    if ($scope.allSavingDisabled) {
      // It should not be possible to navigate to this function if allSavingDisabled is set
      // but adding check here as a safeguard.
      require('ui/notify').warning('Saving is disabled');
      return;
    }
    $scope.savedWorkspace.id = $scope.savedWorkspace.title;
    const canSaveData = $scope.graphSavePolicy === 'configAndData' ||
      ($scope.graphSavePolicy === 'configAndDataWithConsent' && $scope.userHasConfirmedSaveWorkspaceData);


    var blacklist = [];
    var vertices = [];
    var links = [];
    if (canSaveData) {
      blacklist = $scope.workspace.blacklistedNodes.map(function (node) {
        return {
          x: node.x,
          y: node.y,
          field: node.data.field,
          term: node.data.term,
          label: node.label,
          color: node.color,
          parent: null,
          weight: node.weight,
          size: node.scaledSize,
        };
      });
      vertices = $scope.workspace.nodes.map(function (node) {
        return {
          x: node.x,
          y: node.y,
          field: node.data.field,
          term: node.data.term,
          label: node.label,
          color: node.color,
          parent: node.parent ? $scope.workspace.nodes.indexOf(node.parent) : null,
          weight: node.weight,
          size: node.scaledSize,
        };
      });
      links = $scope.workspace.edges.map(function (edge) {
        return {
          'weight': edge.weight,
          'width': edge.width,
          'inferred': edge.inferred,
          'label': edge.label,
          'source': $scope.workspace.nodes.indexOf(edge.source),
          'target': $scope.workspace.nodes.indexOf(edge.target)
        };
      });
    }

    $scope.savedWorkspace.wsState = JSON.stringify({
      'indexPattern': $scope.selectedIndex,
      'selectedFields': $scope.selectedFields.map(function (field) {
        return {
          'name':field.name,
          'lastValidHopSize':field.lastValidHopSize,
          'color':field.color,
          'iconClass':field.icon.class,
          'hopSize':field.hopSize
        };
      }),
      'blacklist': blacklist,
      'vertices': vertices,
      'links': links,
      exploreControls: $scope.exploreControls
    });
    $scope.savedWorkspace.numVertices = vertices.length;
    $scope.savedWorkspace.numLinks = links.length;
    $scope.savedWorkspace.description = $scope.description;


    $scope.savedWorkspace.save().then(function (id) {
      $scope.kbnTopNav.close('save');
      $scope.userHasConfirmedSaveWorkspaceData = false; //reset flag
      if (id) {
        var message = 'Saved Workspace "' + $scope.savedWorkspace.title + '"';
        if (!canSaveData && $scope.workspace.nodes.length > 0) {
          message += ' (the workspace configuration but not the data was saved)';
        }
        require('ui/notify').info(message);
        if ($scope.savedWorkspace.id === $route.current.params.id) return;
        $scope.openSavedWorkspace($scope.savedWorkspace);
      }
    }, require('ui/notify').fatal);

  };



});
//End controller
