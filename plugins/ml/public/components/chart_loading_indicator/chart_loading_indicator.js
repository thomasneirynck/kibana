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

import $ from 'jquery';

/*
 * Contains a function which draws a spinner icon to indicate that
 * a chart is loading.
 */

// Shows or hides the spinner icon which indicates a chart is loading.
// Requires the element on which the icon is displayed, plus the
// height of the chart if 'show' is true.
export function showChartLoading(show, element, chartHeight) {
  if(show) {
    const $loader = $('<div class="ml-chart-loading-indicator"><h2><i class="fa fa-spinner fa-spin"></i></h2></div>');
    $loader.css('height', chartHeight);
    element.append($loader);
  } else {
    element.find('.ml-chart-loading-indicator').remove();
  }
}
