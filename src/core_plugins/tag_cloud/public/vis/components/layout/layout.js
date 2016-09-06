import d3 from 'd3';
import _ from 'lodash';

function formatType(length, type, cols) {
  let output = {};

  switch (type) {
    case 'grid':
      output.rows = cols ? Math.ceil(length / cols) : Math.round(Math.sqrt(length));
      output.columns = cols || Math.ceil(Math.sqrt(length));
      break;

    case 'columns':
      output.rows = 1;
      output.columns = length;
      break;

    default:
      output.rows = length;
      output.columns = 1;
      break;
  }

  return output;
}

function baseLayout() {
  let type = 'grid'; // available types: 'rows', 'columns', 'grid'
  let size = [250, 250]; // [width, height]
  let rowScale = d3.scale.linear();
  let columnScale = d3.scale.linear();
  let numOfCols = 0;

  function layout(data) {
    let format = formatType(data.length, type, numOfCols);
    let rows = format.rows;
    let columns = format.columns;
    let cellWidth = size[0] / columns;
    let cellHeight = size[1] / rows;
    let cell = 0;
    let newData = [];

    rowScale.domain([0, rows]).range([0, size[1]]);
    columnScale.domain([0, columns]).range([0, size[0]]);

    d3.range(rows).forEach(function (row) {
      d3.range(columns).forEach(function (col) {
        let datum = data[cell];
        let obj = {
          dx: columnScale(col),
          dy: rowScale(row),
          width: cellWidth,
          height: cellHeight
        };

        function reduce(a, b) {
          a[b] = datum[b];
          return a;
        }

        if (!datum) { return; }

        // Do not mutate the original data, return a new object
        newData.push(Object.keys(datum).reduce(reduce, obj));
        cell += 1;
      });
    });

    return newData;
  }

  // Public API
  layout.type = function (v) {
    if (!arguments.length) { return type; }
    type = _.isString(v) ? v : type;
    return layout;
  };

  layout.columns = function (v) {
    if (!arguments.length) { return numOfCols; }
    numOfCols = _.isNumber(v) ? v : numOfCols;
    return layout;
  };

  layout.size = function (v) {
    if (!arguments.length) { return size; }
    size = (_.isArray(v) && _.size(v) === 2 && _.all(v, _.isNumber)) ? v : size;
    return layout;
  };

  return layout;
}

export default baseLayout;
