import control from 'plugins/tagcloud/vis/components/control/events';
import layoutGenerator from 'plugins/tagcloud/vis/components/layout/generator';
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
        .transform('translate(' + (width / 2) + ',' + (height / 2) + ')');

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
    width = v;
    return generator;
  };

  generator.height = function (v) {
    if (!arguments.length) {
      return height;
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


function tagCloudGenerator() {

  console.log('intialize visualization module');
  let options = {};

  function generator(selection) {

    console.log('layout the tag cloud', selection);

    selection.each(function (data) {

      const dataOpts = (data && data.options) || {};
      const accessor = options.accessor || dataOpts.accessor || 'tags';
      const tagCloud = makeTagCloud()
        .width(data.width)
        .height(data.height)
        .accessor(accessor);

      builder(options, tagCloud);
      builder(dataOpts, tagCloud);

      console.log('drawing the chart');
      // d3.select(this).call(tagCloud); // Draw Chart
      tagCloud(d3.select(this));
    });
  }

  // Public API
  generator.options = function (v) {
    if (!arguments.length) {
      console.log('get the options: ', arguments);
      return options;
    }
    console.log('set te options');
    options = _.isPlainObject(v) && !_.isArray(v) ? v : options;
    return generator;
  };

  return generator;
}


function tagCloudVisualization() {


  console.log('new tag cloud vis');
  let events = control();
  let layout = layoutGenerator();
  let tagCloud = tagCloudGenerator();
  let opts = {};
  let listeners = {};
  let size = [250, 250];

  function generator(selection) {

    console.log('dump it in da thing');

    selection.each(function () {

      //todo: there is no reason we should expect multiple data here, but somehow we do....
      events.listeners(listeners);

      layout.attr({
        type: opts.layout || 'grid',
        columns: opts.numOfColumns || 0,
        size: size
      });

      tagCloud.options(opts);

      const groupSelection = d3.select(this)
        .attr('width', '100%')
        .attr('height', size[1]);

      events(groupSelection);
      layout(groupSelection);

      groupSelection.selectAll('g.chart');


      tagCloud(groupSelection);
    });
  }

  // Public API
  generator.options = function (v) {
    opts = _.isPlainObject(v) ? v : opts;
    return generator;
  };

  generator.listeners = function (v) {
    listeners = _.isPlainObject(v) ? v : listeners;
    return generator;
  };

  generator.size = function (v) {
    if (!arguments.length) { return size; }
    size = (_.isArray(v) && _.size(v) === 2) ? v : size;
    return generator;
  };

  return generator;
}

export default tagCloudVisualization;
