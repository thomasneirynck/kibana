import d3 from 'd3';
import _ from 'lodash';

// Adds event listeners to DOM elements
function events() {

  let listeners = {};

  function control(selection) {

    selection.each(function () {
      const svg = d3.select(this);

      d3.entries(listeners).forEach(function (d) {
        svg.on(d.key, function () {
          d3.event.stopPropagation();
        });
      });
    });
  }

  // Public API
  control.listeners = function (v) {
    if (!arguments.length) { return listeners; }
    listeners = _.isPlainObject(v) ? v : listeners;
    return control;
  };

  return control;
}

export default events;
