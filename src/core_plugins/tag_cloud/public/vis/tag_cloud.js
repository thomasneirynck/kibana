import LayoutGenerator from 'plugins/tagcloud/vis/components/layout/layout';
import d3 from 'd3';
import _ from 'lodash';
import layoutCloud from 'd3-cloud';
import gGenerator from 'plugins/tagcloud/vis/components/elements/g';
import textElement from 'plugins/tagcloud/vis/components/elements/text';
import valuator from 'plugins/tagcloud/vis/components/utils/valuator';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';


class TagCloud {

  constructor() {
    this.textScale = d3.scale.linear();
    this.accessor = function (d) {
      return d;
    };
    const colorScale = d3.scale.ordinal().range(vislibComponentsSeedColorsProvider());
    this.fontNormal = d3.functor('normal');
    this.width = 250;
    this.height = 250;
    this.rotationScale = d3.scale.linear();
    this.orientations = 2;
    this.fromDegree = 0;
    this.toDegree = 0;
    this.font = d3.functor('serif');
    this.fontSize = (d) => {
      return this.textScale(d.size);
    };
    this.fontStyle = this.fontNormal;
    this.fontWeight = this.fontNormal;
    this.minFontSize = 12;
    this.maxFontSize = 60;
    this.padding = 1;
    this.textAccessor = function (d) {
      return d.text;
    };
    this.fill = function (d) {
      return colorScale(d.text);
    };
    this.fillOpacity = d3.functor(1);
    this.textAnchor = d3.functor('middle');
    this.textClass = 'tag';
  }


  render(selection) {

    const self = this;
    selection.each(function (data, index) {

      let tags = self.accessor.call(this, data, index);

      let text = textElement()
        .cssClass(self.textClass)
        .fontSize(fontSizeAsPixels)
        .fill(self.fill)
        .fillOpacity(self.fillOpacity)
        .textAnchor(self.textAnchor);


      let group = gGenerator()
        .cssClass('tags')
        .transform('translate(' + (self.width > 0 ? self.width / 2 : 1) + ',' + (self.height > 0 ? self.height / 2 : 1) + ')');

      let g = d3.select(this)
        .datum([data])
        .call(group);

      let numOfOrientations = self.orientations - 1;
      self.rotationScale
        .domain([0, numOfOrientations])
        .range([self.fromDegree, self.toDegree]);

      self.textScale
        .domain(d3.extent(tags, getSize))
        .range([self.minFontSize, self.maxFontSize]);

      function draw(tags) {
        g.select('g.' + group.cssClass())
          .datum(tags)
          .call(text);
      }

      layoutCloud()
        .size([self.width, self.height])
        .words(tags)
        .text(self.textAccessor)
        .rotate(function () {
          return self.rotationScale(Math.round(Math.random() * numOfOrientations));
        })
        .font(self.font)
        .fontStyle(self.fontStyle)
        .fontWeight(self.fontWeight)
        .fontSize(self.fontSize)
        .padding(self.padding)
        .on('end', draw)
        .start();
    });
  }


  setOptions(options) {
    for (let key in options) {//safe prop loop, options is always simple json
      if (options.hasOwnProperty(key)) {

        if (key === 'textScale') {
          this[key] = d3.scale[options[key]]();
        } else {
          this[key] = options[key];
        }


      }
    }
  };


}

function getSize(d) {
  return d.size;
}

function fontSizeAsPixels(d) {
  return d.size + 'px';
}

/**
 * Renders a tagcloud for each data-set in the grid
 */
export default class MultiTagCloud {

  constructor() {
    this._layout = new LayoutGenerator();
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

      let groupSelection = d3.select(this)
        .attr('width', '100%')
        .attr('height', self._size[1]);
      self._layout.render(groupSelection);

      const charts = groupSelection.selectAll('g.chart');
      charts.each(function (data) {

        const accessor = 'tags';
        const tagCloud = new TagCloud();
        tagCloud.width = data.width;
        tagCloud.height = data.height;
        tagCloud.accessor = valuator(accessor);

        tagCloud.setOptions(self._opts);
        tagCloud.render(d3.select(this));

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
