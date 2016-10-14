import gGenerator from 'plugins/tagcloud/vis/elements/g';
import d3 from 'd3';
import _ from 'lodash';

function formatType(length, type, cols) {

  const output = {rows: null, columns: null};

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

export function baseLayout() {
  let type = 'grid'; // available types: 'rows', 'columns', 'grid'
  let size = [250, 250]; // [width, height]
  let rowScale = d3.scale.linear();
  let columnScale = d3.scale.linear();
  let numOfCols = 0;

  function layout(data) {
    const format = formatType(data.length, type, numOfCols);
    const rows = format.rows;
    const columns = format.columns;
    const cellWidth = size[0] / columns;
    const cellHeight = size[1] / rows;
    let cell = 0;
    const newData = [];

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

        if (!datum) {
          return;
        }

        // Do not mutate the original data, return a new object
        newData.push(Object.keys(datum).reduce(reduce, obj));
        cell += 1;
      });
    });

    return newData;
  }

  // Public API
  layout.type = function (v) {
    if (!arguments.length) {
      return type;
    }
    type = _.isString(v) ? v : type;
    return layout;
  };

  layout.columns = function (v) {
    if (!arguments.length) {
      return numOfCols;
    }
    numOfCols = _.isNumber(v) ? v : numOfCols;
    return layout;
  };

  layout.size = function (v) {
    if (!arguments.length) {
      return size;
    }
    size = (_.isArray(v) && _.size(v) === 2 && _.all(v, _.isNumber)) ? v : size;
    return layout;
  };

  return layout;
}

function translate(d) {
  return 'translate(' + d.dx + ',' + d.dy + ')';
}

export default class LayoutGenerator {

  constructor() {
    this._layout = baseLayout();
    this._group = gGenerator();
  }

  render(selection) {
    var self = this;
    selection.each(function (data) {
      self._group
        .cssClass('chart')
        .transform(translate);

      d3.select(this)
        .datum(self._layout(data))
        .call(self._group);
    });
  }

  setType(type) {
    this._layout(type);
  };

  setColumns(columns) {
    this._layout.columns(columns);
  };

  setSize(size) {
    this._layout.size(size);
  };

}
