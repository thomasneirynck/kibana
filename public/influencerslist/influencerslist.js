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
 * Prelert visualization displaying a list of the top influencers for the
 * selected Prelert job(s).
 * Progress bar style components are used to show the maximum and total
 * anomaly score by influencer field name and value.
 */

    
import 'plugins/prelert/influencerslist/influencerslist_controller.js';
import 'plugins/prelert/influencerslist/influencerslist.less';

import TemplateVisTypeProvider from 'ui/template_vis_type/template_vis_type';
import VisSchemasProvider from 'ui/vis/schemas';

export default function InfluencersListVisType(Private) {
  const TemplateVisType = Private(TemplateVisTypeProvider);
  const Schemas = Private(VisSchemasProvider);

  // Return a new instance describing this visualization.
  return new TemplateVisType({
    name: 'prlInfluencersList',
    title: 'Influencers list',
    icon: 'fa-list', 
    description: 'Prelert visualization designed to display a list of the top influencers ' +
      'by maximum and total anomaly score across Prelert jobs.',
    template: require('plugins/prelert/influencerslist/influencerslist.html'),
    params: {
      editor: require('plugins/prelert/influencerslist/influencerslist_editor.html'), 
    },
    schemas: new Schemas([
      {
        group: 'metrics',
        name: 'totalScore',
        title: 'Total score',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'metrics',
        name: 'maxScore',
        title: 'Max score (0 to 100)',
        min: 1,
        max: 1,
        aggFilter: ['count', 'avg', 'sum', 'min', 'max']
      },
      {
        group: 'buckets',
        name: 'viewBy1',
        icon: 'fa fa-eye',
        title: 'First split by',
        mustBeFirst: true,
        min: 1,
        max: 1,
        aggFilter: 'terms'
      },
      {
        group: 'buckets',
        name: 'viewBy2',
        icon: 'fa fa-eye',
        title: 'Second split by',
        min: 1,
        max: 1,
        aggFilter: 'terms'
      }
    ])
  });
};
