var d3 = require('d3');
var venn = require('venn.js');
var dv = require('ace');
var av = require('./angular-venn-simple.js');
var gws = require('./graphClientWorkspace.js');
var utils = require('./utils.js');
import IndexPatternsProvider from 'ui/index_patterns/index_patterns';
require('plugins/graph/less/main.less');
var graphLogo = require('plugins/graph/header.png');
require('ui/chrome').setBrand({
  'logo': 'url(' + graphLogo + ') left no-repeat',
  'smallLogo': 'url(' + graphLogo + ') left no-repeat'
}).setNavBackground('#222222').setTabs([]);



var app = require('ui/modules').get('app/graph', ['angular-venn-simple']);

app.directive('focusOn', function () {
  return function (scope, elem, attr) {
    scope.$on(attr.focusOn, function (e) {
      elem[0].focus();
    });
  };
});


if (require('ui/routes').enable) {
  require('ui/routes').enable();
}

require('ui/routes')
  .when('/', {
    template: require('plugins/graph/templates/index.html'),
    resolve: {
      GetIndexPatternIds: function (Private) {
        const indexPatterns = Private(IndexPatternsProvider);
        return indexPatterns.getIds();
      },
      GetIndexPatternProvider: function (Private) {
        return Private(IndexPatternsProvider);
      }

    }
  });

//========  Controller for basic UI ==================
app.controller('graphuiPluginBasic', function ($scope, $route, $interval, $http) {

  $scope.title = 'Graph';
  $scope.description = 'Graph exploration';
  // These control the main configuration choices
  $scope.showConfig = false; //controls visibility of the config panel
  $scope.spymode = 'request';
  $scope.colorChoices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  $scope.iconChoices = [
    //Patterns are used to help default icon choices for common field names
    {
      class: 'fa-folder-open-o',
      code: '\uf115',
      'patterns': [/category/i, /folder/i, /group/i]
    }, {
      class: 'fa-cube',
      code: '\uf1b2',
      'patterns': [/prod/i, /sku/i]
    }, {
      class: 'fa-key',
      code: '\uf084',
      'patterns': [/key/i]
    }, {
      class: 'fa-bank',
      code: '\uf19c',
      'patterns': [/bank/i, /account/i]
    }, {
      class: 'fa-automobile',
      code: '\uf1b9',
      'patterns': [/car/i, /veh/i]
    }, {
      class: 'fa-home',
      code: '\uf015',
      'patterns': [/address/i, /home/i]
    }, {
      class: 'fa-question',
      code: '\uf128',
      'patterns': [/query/i, /search/i]
    }, {
      class: 'fa-plane',
      code: '\uf072',
      'patterns': [/flight/i, /plane/i]
    }, {
      class: 'fa-file-o',
      code: '\uf016',
      'patterns': [/file/i, /doc/i]
    }, {
      class: 'fa-user',
      code: '\uf007',
      'patterns': [/user/i, /person/i, /people/i, /owner/i, /cust/i, /participant/i, /party/i]
    }, {
      class: 'fa-music',
      code: '\uf001',
      'patterns': [/artist/i, /sound/i]
    }, {
      class: 'fa-flag',
      code: '\uf024',
      'patterns': [/country/i, /warn/i, /flag/i]
    }, {
      class: 'fa-tag',
      code: '\uf02b',
      'patterns': [/tag/i, /label/i]
    }, {
      class: 'fa-phone',
      code: '\uf095',
      'patterns': [/phone/i]
    }, {
      class: 'fa-desktop',
      code: '\uf108',
      'patterns': [/host/i, /server/i]
    }, {
      class: 'fa-font',
      code: '\uf031',
      'patterns': [/text/i, /title/i, /body/i, /desc/i]
    }, {
      class: 'fa-at',
      code: '\uf1fa',
      'patterns': [/account/i, /email/i]
    }

  ];
  $scope.fields = [];
  $scope.searchTerm = '';


  //Updates styling on all nodes in the UI that use this field
  $scope.applyColor = function (fieldDef, color) {
    fieldDef.color = color;
    if ($scope.workspace) {
      $scope.workspace.nodes.forEach(function (node) {
        if (node.data.fieldDef === fieldDef) {
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
        if (node.data.fieldDef === fieldDef) {
          node.icon = icon;
        }
      });
    }
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
      //$scope.detail={latestNodeSelection:n};
    } else {
      $scope.detail = null;
    }
  };

  $scope.toggleFieldSelected = function (field) {
    field.selected = !field.selected;
    $scope.fieldSelected(field);
    if (field.selected) {
      $scope.selectedField = field;
    } else {
      $scope.selectedField = null;
    }
  };


  //A live response field is one that is both selected and actively enabled for returning in responses
  $scope.updateLiveResponseFields = function () {
    $scope.liveResponseFields = $scope.selectedFields.filter(function (fieldDef) {
      return fieldDef.isActiveResponseField && fieldDef.selected;
    });
  };

  $scope.toggleActiveResponseField = function (field) {
    field.isActiveResponseField = !field.isActiveResponseField;
    $scope.updateLiveResponseFields();
  };

  $scope.toggleAdvancedMode = function () {
    $scope.advancedMode = !$scope.advancedMode;
    if (!$scope.advancedMode) {
      $scope.hideAllConfigPanels();
      //Switching back from advancedMode clears field selections
      $scope.setAllFieldStatesToDefault();
    }
    $scope.detail = null;
  };

  $scope.hideAllConfigPanels = function () {
    $scope.showConfig = false;
    $scope.showFieldOptions = false;
  };

  $scope.setAllFieldStatesToDefault = function () {
    $scope.selectedFields = [];
    $scope.basicModeSelectedSingleField = null;
    $scope.liveResponseFields = [];

    // Default field states are "not selected" and
    // actively enabled for return in responses
    $scope.allFields.forEach(function (fieldDef) {
      fieldDef.isActiveResponseField = true;
      fieldDef.selected = false;
    });
  };

  $scope.fieldSelected = function (field) {
    if (field.selected) {
      if ($scope.selectedFields.indexOf(field) < 0) {
        $scope.selectedFields.push(field);
      }
    } else {
      // Find and remove item from an array
      var i = $scope.selectedFields.indexOf(field);
      if (i != -1) {
        $scope.selectedFields.splice(i, 1);
      }
    }
    $scope.updateLiveResponseFields();

  };



  //  Remove this the right way to do this will be to reuse saved visualizations for
  // any drill-downs.
  $scope.displayFieldSelected = function (selectedDisplayField) {
    $scope.selectedDisplayField = selectedDisplayField;
  };



  $scope.indexSelected = function (selectedIndex) {
    $scope.clearWorkspace();
    $scope.allFields = [];
    $scope.selectedFields = [];
    $scope.basicModeSelectedSingleField = null;
    $scope.selectedField = null;
    $scope.selectedIndex = selectedIndex;

    var promise = $route.current.locals.GetIndexPatternProvider.get(selectedIndex);
    promise.then(function (indexPattern) {
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
          graphFieldDef.color = index % $scope.colorChoices.length;
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
      },
      function (err) {
        require('ui/notify').error(err);
      });

      // // TODO Load the list of saved visualizations for this index pattern
      // getSavedVisualizations(selectedIndex.name, function(resp){
      //   console.log("Got saved visualizations:", resp);
      // });
      // console.log("user",toUser({"foo":["bar", "bar2"]}));


  };

  // Replacement function for graphClientWorkspace's comms so
  // that it works with Kibana.
  function callNodeProxy(indexName, query, responseHandler) {
    var request = {
      index: indexName,
      query: query
    };
    $http.post('../api/graph/graphExplore', request)
      .then(function (resp) {
        if (resp.data.resp.timed_out) {
          require('ui/notify').warning('Exploration timed out');
        }else {
          var graph = resp.data.resp;
          if ($scope.workspace.nodes.length == 0  && graph.vertices.length > 0
            && graph.connections.length == 0 && !$scope.advancedMode) {
              // We think the user has tried searching on a single-value field in basic mode.
              // Steer them to the advanced mode and using multiple fields.
            $scope.detail = {
              'suggestNoGraphFixes':true
            };
          }
        }

        responseHandler(resp.data.resp);
      })
      .catch(err => require('ui/notify').error(err));
  }

  //Find all saved visualizations that target this index
  // FIXME - this is not a robust means of listing visualizations that are relevant!!!
  // May need some Kibana core work. Not currently used.
  var getSavedVisualizations = function (indexName, responseHandler) {
    var request = {
      index: '.kibana',
      type: 'visualization',
      body: {
        'query': {
          'term':{
            'kibanaSavedObjectMeta.searchSourceJSON': indexName
          }
        },
        'size': 10
      }
    };

    $http.post('../api/graph/getExampleDocs', request)
      .then(function (resp) {
        responseHandler(resp.data.resp);
      })
      .catch(err => require('ui/notify').error(err));
  };

  //TODO remove me - link to saved visualizations instead and embed them with a split-screen splitter
  var callSearchNodeProxy = function (indexName, query, responseHandler) {
    var request = {
      index: indexName,
      body: query
    };
    $http.post('../api/graph/getExampleDocs', request)
      .then(function (resp) {
        responseHandler(resp.data.resp);
      })
      .catch(err => require('ui/notify').error(err));
  };

  $scope.submit = function () {
    $scope.hideAllConfigPanels();
    initWorkspaceIfRequired();
    var numHops = 2;
    $scope.workspace.simpleSearch($scope.searchTerm, $scope.liveResponseFields, numHops);
  };

  $scope.clearWorkspace = function () {
    $scope.workspace = null;
    $scope.detail = null;
  };

  $scope.toggleConfigPanel = function () {
    $scope.showConfig = !$scope.showConfig;
    if ($scope.showConfig) {
      $scope.showFieldOptions = false;
      $scope.configPanel = 'settings';
    }
  };
  $scope.toggleShowAdvancedFieldsConfig = function () {
    $scope.showConfig = false;
    $scope.showFieldOptions = !$scope.showFieldOptions;
  };

  $scope.selectSelected = function (node) {
    if ($scope.advancedMode) {
      // Basic mode does not offer any details behind the last selected node
      $scope.detail = {
        latestNodeSelection: node
      };
    }
    return $scope.selectedSelectedVertex = node;
  };

  $scope.selectFieldDef = function (fieldDef) {
    $scope.selectedField = fieldDef;
  };



  $scope.isSelectedSelected = function (node) {
    return $scope.selectedSelectedVertex === node;
  };


  $scope.basicModeChangedField = function (newChoice) {
    //See https://github.com/elastic/x-plugins/issues/1051#issuecomment-178884232

    $scope.clearWorkspace();
    $scope.clearBasicFieldSelected();

    $scope.basicModeSelectedSingleField = newChoice;
    //Undo any deselection that may have occurred in advanced mode
    if (newChoice != null) {
    //  newChoice.isActiveResponseField = true;
      $scope.selectedFields = [$scope.basicModeSelectedSingleField];
      newChoice.selected = true;
    } else {
      //TODO -mightn't we best retain a list of fields used in the workspace?
      $scope.selectedFields = [];
      $scope.liveResponseFields = [];
    }
    $scope.updateLiveResponseFields();
  };

  $scope.clearBasicFieldSelected = function () {
    if ($scope.basicModeSelectedSingleField) {
      //clear the old choice from being selected in case we flip into advancedMode
      $scope.basicModeSelectedSingleField.selected = false;
    }
    $scope.basicModeSelectedSingleField = null;
  };

  $scope.resetWorkspace = function () {
    $scope.clearWorkspace();
    $scope.advancedMode = false;
    $scope.selectedIndex = null;
    $scope.detail = null;
    $scope.selectedSelectedVertex = null;
    $scope.selectedField = null;
    $scope.allFields = [];
    $scope.clearBasicFieldSelected();

    $scope.hoverNode = null;
    $scope.selectedFields = [];
    $scope.configPanel = 'settings';
    $scope.liveResponseFields = [];

    $scope.selectedDisplayField = null;
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

  // TODO  remove this - want proper drill downs to solid kibana visualizations.
  // Only retaining for now to illustrate concept of
  //  drilling down to details of docs.
  $scope.showSelectedDocs = function () {
    $scope.workspace.getSelectionsExampleDocs(function (docs) {
      $scope.detail = {
        'exampleDocs': docs
      };
    });
  };

  $scope.performMerge = function (parentId, childId) {
    var found = true;
    while (found) {
      found = false;
      for (var i in $scope.detail.mergeCandidates) {
        var mc = $scope.detail.mergeCandidates[i];
        if ((mc.id1 == childId) || (mc.id2 == childId)) {
          $scope.detail.mergeCandidates.splice(i, 1);
          found = true;
          break;
        }
      }
    }
    $scope.workspace.mergeIds(parentId, childId);
    if ($scope.detail.mergeCandidates.length == 0) {
      $scope.detail = null;
    }
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
    if ($scope.zoomLevel != d3.event.scale) {
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



  if ($scope.indices.length == 0) {
    require('ui/notify').warning('Oops, no data sources. First head over to Kibana settings and define a choice of index pattern');
  }

});
//End controller
