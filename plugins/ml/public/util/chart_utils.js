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

import { calculateTextWidth } from 'plugins/ml/util/string_utils';
import moment from 'moment';

const MAX_LABEL_WIDTH = 100;

export function drawLineChartDots(data, lineChartGroup, lineChartValuesLine, radius = 1.5) {
  // We need to do this because when creating a line for a chart which has data gaps,
  // if there are single datapoints without any valid data before and after them,
  // the lines created by using d3...defined() do not contain these data points.
  // So this function adds additional circle elements to display the single
  // datapoints in additional to the line created for the chart.

  // first reduce the dataset to data points
  // where the previous and next one don't contain any data
  const dotsData = data.reduce((p, c, i) => {
    const previous = data[i - 1];
    const next = data[i + 1];
    if (
      (typeof previous === 'undefined' || (previous && previous.value === null)) &&
      c.value !== null &&
      (typeof next === 'undefined' || (next && next.value === null))
    ) {
      p.push(c);
    }
    return p;
  }, []);

  // check if `g.values-dots` already exists, if not create it
  // in both cases assign the element to `dotGroup`
  const dotGroup = (lineChartGroup.select('.values-dots').empty())
    ? lineChartGroup.append('g').classed('values-dots', true)
    : lineChartGroup.select('.values-dots');

  // use d3's enter/update/exit pattern to render the dots
  const dots = dotGroup.selectAll('circle').data(dotsData);

  dots.enter().append('circle')
    .attr('r', radius);

  dots
    .attr('cx', lineChartValuesLine.x())
    .attr('cy', lineChartValuesLine.y());

  dots.exit().remove();
}

export function numTicks(axisWidth) {
  return axisWidth / MAX_LABEL_WIDTH;
}

export function numTicksForDateFormat(axisWidth, dateFormat) {
  // Allow 1.75 times the width of a formatted date per tick for padding.
  const tickWidth = calculateTextWidth(moment().format(dateFormat), false);
  return axisWidth / (1.75 * tickWidth);
}
