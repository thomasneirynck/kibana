/**
 * Set the {@code legend} using the supplied data {@code index} in each series.
 *
 * @param legend {Function} The legend containing each series item.
 * @param plot {Object} The plot dataset.
 * @param index {number} The index of the data to show in each series.
 */
export function setLegendForSeriesIndex(legend, plot, index) {
  const datasets = plot.getData();

  for (let i = 0; i < datasets.length; i++) {
    const series = datasets[i];
    const data = series.data;

    let y = null;

    if (data.length > index && data[index]) {
      y = data[index][1];
    }

    legend(series, i, y);
  }
}

/**
 * Set the {@code legend} by finding the closest {@code x} coordinate.
 *
 * Note: This method assumes that all series in the same plot are either equal, or they are empty. This may not be
 * true when we add swappable charts with user-selected values in each chart (if the values don't come from the same
 * documents in the same indices, then it's not guaranteed)! This assumption is currently true for all charts.
 *
 * The fix for that is to perform this check per series rather than per plot, and to perform it on the
 * {@code item.datapoint[0]} value from the plotHover event instead of its raw index value.
 *
 * @param legend {Function} The legend containing each series item.
 * @param plot {Object} The plot tool.
 * @param x {number} The X coordinate of the cursor.
 */
export function setLegendByX(legend, plot, x) {
  const axes = plot.getAxes();

  if (x < axes.xaxis.min || x > axes.xaxis.max) {
    // note: this does _not_ clear it if they just moved their mouse out, but it won't initialize it either
    return;
  }

  const datasets = plot.getData();

  // Check each series for the closest point; first one to match wins!
  // Note: All series _should_ have the same X coordinates
  for (let i = 0; i < datasets.length; i++) {
    const index = findIndexByX(datasets[i].data, x);

    // It's possible that a given series is blank, so we just go onto the next one
    if (index !== -1) {
      setLegendForSeriesIndex(legend, plot, index);
      break;
    }
  }
}

/**
 * Find the closest index to the {@code x} coordinate within the current series {@code data}.
 *
 * @param data {Array} Series array from the plot.
 * @param x {number} The X coordinate of the cursor.
 * @returns {number} -1 if none.
 */
export function findIndexByX(data, x) {
  const length = data.length;

  if (length === 1) {
    return 0;
  } else if (length !== 0) {
    let prev = null;

    // we need to record previous, if it exists
    if (data[0]) {
      prev = 0;
    }

    // Nearest point (note we start at 1, not 0 because we always look backward)
    for (let j = 1; j < length; ++j) {
      if (data[j]) {
        if (data[j][0] > x) {
          const currentDistance = data[j][0] - x;

          // see if the previous point was actually closer to the X position
          if (prev !== null && currentDistance > Math.abs(x - data[prev][0])) {
            return prev;
          } else {
            return j;
          }
        }

        prev = j;
      }
    }
  }

  // note: if length is 0, then it's -1; if it's not, then the last index is returned
  return length - 1;
}
