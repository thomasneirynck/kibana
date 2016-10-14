import layoutGenerator from 'plugins/tagcloud/vis/components/layout/layout';
import d3 from 'd3';
import _ from 'lodash';
import builder from 'plugins/tagcloud/vis/components/utils/builder';
import layoutCloud from 'd3-cloud';
import gGenerator from 'plugins/tagcloud/vis/components/elements/g';
import textElement from 'plugins/tagcloud/vis/components/elements/text';
import valuator from 'plugins/tagcloud/vis/components/utils/valuator';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';

function makeTagCloud() {

  console.log('tagcloud module');

  let textScale = d3.scale.linear();
  let accessor = function (d) {
    return d;
  };
  let colorScale = d3.scale.ordinal().range(vislibComponentsSeedColorsProvider());
  let fontNormal = d3.functor('normal');
  let width = 250;
  let height = 250;
  let rotationScale = d3.scale.linear();
  let orientations = 2;
  let fromDegree = 0;
  let toDegree = 0;
  let font = d3.functor('serif');
  let fontSize = function (d) {
    return textScale(d.size);
  };
  let fontStyle = fontNormal;
  let fontWeight = fontNormal;
  let minFontSize = 12;
  let maxFontSize = 60;
  let padding = 1;
  let textAccessor = function (d) {
    return d.text;
  };
  let fill = function (d) {
    return colorScale(d.text);
  };
  let fillOpacity = d3.functor(1);
  let textAnchor = d3.functor('middle');
  let textClass = 'tag';

  function getSize(d) {
    return d.size;
  }

  function generator(selection) {

    console.log('make tag cloud', selection);
    selection.each(function (data, index) {

      let tags = accessor.call(this, data, index);
      // let tags = data[index].tags;
      console.log('tags', tags);

      let text = textElement()
        .cssClass(textClass)
        .fontSize(function (d) {
          return d.size + 'px';
        })
        .fill(fill)
        .fillOpacity(fillOpacity)
        .textAnchor(textAnchor);


      let group = gGenerator()
        .cssClass('tags')
        .transform('translate(' + (width > 0 ? width / 2 : 1) + ',' + (height > 0 ? height / 2 : 1) + ')');

      let g = d3.select(this)
        .datum([data])
        .call(group);

      let numOfOrientations = orientations - 1;
      rotationScale
        .domain([0, numOfOrientations])
        .range([fromDegree, toDegree]);

      textScale
        .domain(d3.extent(tags, getSize))
        .range([minFontSize, maxFontSize]);

      function draw(tags) {
        console.log('tags', tags);
        g.select('g.' + group.cssClass())
          .datum(tags)
          .call(text);
      }

      layoutCloud()
        .size([width, height])
        .words(tags)
        .text(textAccessor)
        .rotate(function () {
          return rotationScale(Math.round(Math.random() * numOfOrientations));
        })
        .font(font)
        .fontStyle(fontStyle)
        .fontWeight(fontWeight)
        .fontSize(fontSize)
        .padding(padding)
        .on('end', draw)
        .start();
    });
  }

  // Public API
  generator.accessor = function (v) {
    if (!arguments.length) {
      return accessor;
    }
    accessor = valuator(v);
    return generator;
  };

  generator.width = function (v) {

    if (!arguments.length) {
      return width;
    }
    console.log('set width', v);
    if (!v) {
      return generator;
    }
    width = v;
    return generator;
  };

  generator.height = function (v) {
    if (!arguments.length) {
      return height;
    }
    console.log('set height', v);
    if (!v) {
      return generator;
    }
    height = v;
    return generator;
  };

  generator.orientations = function (v) {
    if (!arguments.length) {
      return orientations;
    }
    orientations = v;
    return generator;
  };

  generator.fromDegree = function (v) {
    if (!arguments.length) {
      return fromDegree;
    }
    fromDegree = v;
    return generator;
  };

  generator.toDegree = function (v) {
    if (!arguments.length) {
      return toDegree;
    }
    toDegree = v;
    return generator;
  };

  generator.font = function (v) {
    if (!arguments.length) {
      return font;
    }
    font = v;
    return generator;
  };

  generator.fontSize = function (v) {
    if (!arguments.length) {
      return fontSize;
    }
    fontSize = v;
    return generator;
  };

  generator.fontStyle = function (v) {
    if (!arguments.length) {
      return fontStyle;
    }
    fontStyle = v;
    return generator;
  };

  generator.fontWeight = function (v) {
    if (!arguments.length) {
      return fontWeight;
    }
    fontWeight = v;
    return generator;
  };

  generator.minFontSize = function (v) {
    if (!arguments.length) {
      return minFontSize;
    }
    minFontSize = v;
    return generator;
  };

  generator.maxFontSize = function (v) {
    if (!arguments.length) {
      return maxFontSize;
    }
    maxFontSize = v;
    return generator;
  };

  generator.text = function (v) {
    if (!arguments.length) {
      return textAccessor;
    }
    textAccessor = v;
    return generator;
  };

  generator.textScale = function (v) {
    let scales = ['linear', 'log', 'sqrt'];
    if (!arguments.length) {
      return textScale;
    }
    textScale = _.includes(scales, v) ? d3.scale[v]() : textScale;
    return generator;
  };


  generator.textAnchor = function (v) {
    if (!arguments.length) {
      return textAnchor;
    }
    textAnchor = v;
    return generator;
  };

  return generator;
}


/**
 * Renders a tagcloud for each data-set.
 */
export default class TagCloudVisualization {

  constructor() {
    this._layout = layoutGenerator();
    this._opts = {};
    this._size = [250, 250];
  }

  render(selection) {

    var self = this;

    //todo: there is no reason we should expect multiple data here, but somehow we do....
    selection.each(function () {//cannot use anonymous function, d3 needs the special d3-provided `this` scope.

      self._layout.setType(self._opts.layout || 'grid');
      self._layout.setColumns(self._opts.numOfColumns || 0);
      self._layout.setSize(self._size);

      const groupSelection = d3.select(this)
        .attr('width', '100%')
        .attr('height', self._size[1])
        .call(self._layout)
        .selectAll('g.chart');

      groupSelection.each(function (data) {

        const accessor = 'tags';
        const tagCloud = makeTagCloud()
          .width(data.width)
          .height(data.height)
          .accessor(accessor);

        builder(self._opts, tagCloud);

        tagCloud(d3.select(this));
      });

    });
  }

  setOptions(v) {
    this._opts = _.isPlainObject(v) ? v : this._opts;
  }

  setSize(v) {
    this._size = (_.isArray(v) && _.size(v) === 2) ? v : this._size;
  }

};
