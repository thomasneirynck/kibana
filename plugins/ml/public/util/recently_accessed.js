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

// utility functions for managing which links get added to kibana's recently accessed list

import { recentlyAccessed } from 'ui/persisted_log';

export function addItemToRecentlyAccessed(page, itemId, url) {
  let pageLabel = '';
  let id = `ml-job-${itemId}`;

  switch (page) {
    case 'explorer':
      pageLabel = 'Anomaly Explorer';
      break;
    case 'timeseriesexplorer':
      pageLabel = 'Single Metric Viewer';
      break;
    case 'jobs/new_job/datavisualizer':
      pageLabel = 'Data Visualizer';
      id = `ml-datavisualizer-${itemId}`;
      break;
    default:
      console.error('addItemToRecentlyAccessed - No page specified');
      return;
      break;
  }

  url = `ml#/${page}/${url}`;

  recentlyAccessed.add(url, `ML - ${itemId} - ${pageLabel}`, id);
}
