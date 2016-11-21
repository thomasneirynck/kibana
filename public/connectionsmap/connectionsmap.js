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

/*
 * Prelert visualization for displaying a map of connections between the influencers  
 * and detectors in anomalies. Influencers and detectors are 'connected' if they
 * occur together in an anomaly record.
 */

import 'plugins/prelert/connectionsmap/connectionsmap_controller.js';
import 'plugins/prelert/connectionsmap/connectionsmap_directive.js';
import 'plugins/prelert/connectionsmap/connectionsmap.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';
  
export default function ConnectionsMapVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name : 'prlConnectionsMap',
    title : 'Connections map',
    icon : 'fa-link',
    description : 'Prelert visualization for displaying connections between '+
      'the detectors and influencers of anomalies. Influencers and detectors are connected ' + 
      'if they occur together in an anomaly record.',
    requiresSearch : false, // Uses searches created in the visualization controller.
    indexPattern: 'prelertresults-*',
    template : require('plugins/prelert/connectionsmap/connectionsmap.html'),
    params : {
      editor : require('plugins/prelert/connectionsmap/connectionsmap_editor.html'),
      defaults: {
        viewBy: {field:'prelert-detector', label:'detector'},
        jobs: [],
        threshold: {display:'minor', val:25},
      },
      viewByOptions: [{field:'prelert-detector', label:'detector'}],
      thresholdOptions: [{display:'critical', val:75},
                         {display:'major', val:50},
                         {display:'minor', val:25},
                         {display:'warning', val:0}]
    }
  });
};
