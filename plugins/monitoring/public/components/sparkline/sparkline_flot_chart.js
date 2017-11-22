import { last } from 'lodash';
import $ from 'jquery-flot'; // webpackShim

/**
 * Helper class for operations done by Sparkline component on its flot chart
 */

const flotOptions = {
  grid: {
    // No grid
    show: false,

    margin: 4 // px
  },

  // Set series line color
  colors: [ '#3b73ac' ], // Cribbed from components/chart/get_color.js

  series: {
    // No shadow on series lines
    shadowSize: 0, // Cribbed from components/chart/get_options.js

    lines: {
      // Set series line width
      lineWidth: 2 // Cribbed from components/chart/get_options.js
    }
  }
};

function makeData(series = []) {
  const data = [];

  // The actual series to be rendered
  data.push(series);

  // A fake series, containing only the last point from the actual series, to trick flot
  // into showing the "spark" point of the sparkline.
  data.push({
    data: [ last(series) ],
    points: {
      show: true,
      radius: 2,
      fill: 1,
      fillColor: false
    }
  });

  return data;
}

export class SparklineFlotChart {
  constructor(containerElem, initialSeries, overrideOptions) {
    this.containerElem = containerElem;
    this.data = makeData(initialSeries);
    this.options = { ...flotOptions, ...overrideOptions };

    this.render();
    window.addEventListener('resize', this.render);
  }

  render = () => {
    this.flotChart = $.plot(this.containerElem, this.data, this.options);
  }

  update(series) {
    this.flotChart.setData(makeData(series));
    this.flotChart.setupGrid();
    this.flotChart.draw();
  }

  /**
   * Necessary to prevent a memory leak. Shoudl be called any time
   * the chart is being removed from the DOM
   */
  shutdown() {
    this.flotChart.shutdown();
    window.removeEventListener('resize', this.render);
  }
}
