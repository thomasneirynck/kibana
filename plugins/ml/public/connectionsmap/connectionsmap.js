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

/*
 * Ml visualization for displaying a map of connections between the influencers
 * and detectors in anomalies. Influencers and detectors are 'connected' if they
 * occur together in an anomaly record.
 */

import 'plugins/ml/connectionsmap/connectionsmap_controller.js';
import 'plugins/ml/connectionsmap/connectionsmap_directive.js';
import 'plugins/ml/connectionsmap/connectionsmap.less';

import { VisFactoryProvider } from 'ui/vis/vis_factory';

import { ML_RESULTS_INDEX_PATTERN } from 'plugins/ml/constants/results_index_pattern';

export function ConnectionsMapVisType(Private) {

  const VisFactory = Private(VisFactoryProvider);

  return VisFactory.createAngularVisualization({
    name : 'mlConnectionsMap',
    title : 'Connections map',
    icon : 'fa-link',
    description : 'Machine Learning visualization for displaying connections between ' +
      'the detectors and influencers of anomalies. Influencers and detectors are connected ' +
      'if they occur together in an anomaly record.',
    indexPattern: ML_RESULTS_INDEX_PATTERN,
    visConfig: {
      template : require('plugins/ml/connectionsmap/connectionsmap.html'),
      defaults: {
        viewBy: { field:'ml-detector', label:'detector' },
        jobs: [],
        threshold: { display:'minor', val:25 },
      }
    },
    editorConfig: {
      optionsTemplate : require('plugins/ml/connectionsmap/connectionsmap_editor.html'),
      collections: {
        viewByOptions: [{ field:'ml-detector', label:'detector' }],
        thresholdOptions: [{ display:'critical', val:75 },
          { display:'major', val:50 },
          { display:'minor', val:25 },
          { display:'warning', val:0 }]
      }
    }
  });
}
