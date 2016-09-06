import d3 from 'd3';
import _ from 'lodash';
import layoutCloud from 'd3-cloud';
import gGenerator from 'plugins/tagcloud/vis/components/elements/g';
import textElement from 'plugins/tagcloud/vis/components/elements/text';
import valuator from 'plugins/tagcloud/vis/components/utils/valuator';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';

function tagCloud() {
  let textScale = d3.scale.linear();
  let accessor = function (d) { return d; };
  let colorScale = d3.scale.ordinal().range(vislibComponentsSeedColorsProvider());
  let fontNormal = d3.functor('normal');
  let width = 250;
  let height = 250;
  let rotationScale = d3.scale.linear();
  let orientations = 1;
  let fromDegree = 0;
  let toDegree = 0;
  let font = d3.functor('serif');
  let fontSize = function (d) { return textScale(d.size); };
  let fontStyle = fontNormal;
  let fontWeight = fontNormal;
  let minFontSize = 12;
  let maxFontSize = 60;
  let spiral = 'archimedean';
  let padding = 1;
  let textAccessor = function (d) { return d.text; };
  let fill = function (d, i) { return colorScale(d.text); };
  let fillOpacity = d3.functor(1);
  let textAnchor = d3.functor('middle');
  let textClass = 'tag';

  function getSize(d) {
    return d.size;
  }

  function generator(selection) {
    selection.each(function (data, index) {
      let tags = accessor.call(this, data, index);

      let text = textElement()
        .cssClass(textClass)
        .fontSize(function (d) { return d.size + 'px'; })
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
          return rotationScale(~~(Math.random() * numOfOrientations));
        })
        .font(font)
        .fontStyle(fontStyle)
        .fontWeight(fontWeight)
        .fontSize(fontSize)
        .spiral(spiral)
        .padding(padding)
        .on('end', draw)
        .start();
    });
  }

  // Public API
  generator.accessor = function (v) {
    if (!arguments.length) { return accessor; }
    accessor = valuator(v);
    return generator;
  };

  generator.width = function (v) {
    if (!arguments.length) { return width; }
    width = v;
    return generator;
  };

  generator.height = function (v) {
    if (!arguments.length) { return height; }
    height = v;
    return generator;
  };

  generator.orientations = function (v) {
    if (!arguments.length) { return orientations; }
    orientations = v;
    return generator;
  };

  generator.fromDegree = function (v) {
    if (!arguments.length) { return fromDegree; }
    fromDegree = v;
    return generator;
  };

  generator.toDegree = function (v) {
    if (!arguments.length) { return toDegree; }
    toDegree = v;
    return generator;
  };

  generator.font = function (v) {
    if (!arguments.length) { return font; }
    font = v;
    return generator;
  };

  generator.fontSize = function (v) {
    if (!arguments.length) { return fontSize; }
    fontSize = v;
    return generator;
  };

  generator.fontStyle = function (v) {
    if (!arguments.length) { return fontStyle; }
    fontStyle = v;
    return generator;
  };

  generator.fontWeight = function (v) {
    if (!arguments.length) { return fontWeight; }
    fontWeight = v;
    return generator;
  };

  generator.minFontSize = function (v) {
    if (!arguments.length) { return minFontSize; }
    minFontSize = v;
    return generator;
  };

  generator.maxFontSize = function (v) {
    if (!arguments.length) { return maxFontSize; }
    maxFontSize = v;
    return generator;
  };

  generator.spiral = function (v) {
    if (!arguments.length) { return spiral; }
    spiral = v;
    return generator;
  };

  generator.padding = function (v) {
    if (!arguments.length) { return padding; }
    padding = v;
    return generator;
  };

  generator.text = function (v) {
    if (!arguments.length) { return textAccessor; }
    textAccessor = v;
    return generator;
  };

  generator.textScale = function (v) {
    let scales = ['linear', 'log', 'sqrt'];
    if (!arguments.length) { return textScale; }
    textScale = _.includes(scales, v) ? d3.scale[v]() : textScale;
    return generator;
  };

  generator.fill = function (v) {
    if (!arguments.length) { return fill; }
    fill = v;
    return generator;
  };

  generator.fillOpacity = function (v) {
    if (!arguments.length) { return fillOpacity; }
    fillOpacity = v;
    return generator;
  };

  generator.textAnchor = function (v) {
    if (!arguments.length) { return textAnchor; }
    textAnchor = v;
    return generator;
  };

  generator.textClass = function (v) {
    if (!arguments.length) { return textClass; }
    textClass = v;
    return generator;
  };

  return generator;
}

export default tagCloud;
