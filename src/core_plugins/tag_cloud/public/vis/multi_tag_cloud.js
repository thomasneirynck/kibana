import LayoutGenerator from 'plugins/tagcloud/vis/layout/layout';
import d3 from 'd3';
import _ from 'lodash';
import d3TagCloud from 'd3-cloud';
import gGenerator from 'plugins/tagcloud/vis/elements/g';
import textElement from 'plugins/tagcloud/vis/elements/text';
import valuator from 'plugins/tagcloud/vis/utils/valuator';
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

  invalidate() {
    this.render();
  }


  render(selection) {
    const self = this;
    selection.each(function (data, index) {

      const tags = self.accessor.call(this, data, index);
      const text = textElement()
        .cssClass(self.textClass)
        .fontSize(fontSizeAsPixels)
        .fill(self.fill)
        .fillOpacity(self.fillOpacity)
        .textAnchor(self.textAnchor);

      const group = gGenerator()
        .cssClass('tags')
        .transform('translate(' + (self.width > 0 ? self.width / 2 : 1) + ',' + (self.height > 0 ? self.height / 2 : 1) + ')');

      const g = d3.select(this)
        .datum([data])
        .call(group);

      const numOfOrientations = self.orientations - 1;
      self.rotationScale
        .domain([0, numOfOrientations])
        .range([self.fromDegree, self.toDegree]);

      self.textScale
        .domain(d3.extent(tags, getSize))
        .range([self.minFontSize, self.maxFontSize]);

      console.log('tags', tags);
      d3TagCloud()
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
        .on('end', tags => {
          console.log('on end', arguments);
          g.select('g.' + group.cssClass())
            .datum(tags)
            .call(text);
        })
        .start()
        .stop();
    });
  }

  destroy() {
    //noop now.
  }

  setOptions(options) {
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        if (key === 'textScale') {//only exception, needs to be wrapped
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
 * In practice this will always be just one cloud (due to restrictions in the vis data configurator)
 * todo: evaluate if this indirection should be maintained
 */
export default class MultiTagCloud {

  constructor() {
    this._layout = new LayoutGenerator();
    this._options = {};
    this._size = [250, 250];
    this._data = null;
    this._tagClouds = [];
  }

  invalidate() {
    if (!this._data) {
      return;
    }

    this._render();
  }

  _render() {


    console.log('multi-tag-cloud-render', this._data);

    var self = this;
    this._data.each(function () {//cannot use anonymous function, d3 needs the special d3-provided `this` scope.

      console.log('what the fuck is this THIS', this);

      self._layout.setType(self._options.layout || 'grid');
      self._layout.setColumns(self._options.numOfColumns || 0);

      self._layout.setSize(self._size);

      let groupSelection = d3.select(this)
        .attr('width', '100%')
        .attr('height', self._size[1]);
      self._layout.render(groupSelection);

      const charts = groupSelection.selectAll('g.chart');

      console.log('what are these charts', charts);

      charts.each(function (data) {

        console.log('what is this data', data);
        console.log('what is this nested this', this);

        const accessor = 'tags';
        const tagCloud = new TagCloud();
        tagCloud.width = data.width;
        tagCloud.height = data.height;
        tagCloud.accessor = valuator(accessor);

        tagCloud.setOptions(self._options);
        tagCloud.render(d3.select(this));

      });

    });
  }

  destroy() {
    this._tagClouds.forEach(tagCloud => tagCloud.destroy());
  }

  setOptions(options) {
    if (JSON.stringify(this._options) === JSON.stringify(options)) {
      return;
    }
    this._options = options;
    this.invalidate();
  }

  setSize(size) {
    if (size[0] === this._size[0] && this._size[1] === size[1]) {
      return;
    }

    console.log('size...', size);
    this._size = (_.isArray(size) && _.size(size) === 2) ? size : this._size;
    this.invalidate();
  }

  setData(data) {
    this._data = data;
    this.invalidate();
  }

};
