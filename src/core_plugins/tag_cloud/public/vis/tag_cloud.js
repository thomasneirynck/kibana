import d3 from 'd3';
import d3TagCloud from 'd3-cloud';

export default class TagCloud {

  constructor(element) {


    this._element = element;
    this._d3SvgContainer = d3.select(element);


    var self = this;

    this._draw = function draw(words) {

      console.log('DRAW!');

      self._d3SvgContainer.attr('width', self._layout.size()[0]);
      self._d3SvgContainer.attr('height', self._layout.size()[1]);

      self._d3SvgContainer.append('g')
        .attr('transform', 'translate(' + self._layout.size()[0] / 2 + ',' + self._layout.size()[1] / 2 + ')')
        .selectAll('text')
        .data(words)
        .enter().append('text')
        .style('font-size', function (d) {
          return d.size + 'px';
        })
        .style('font-family', 'Impact')
        .style('fill', function (d, i) {
          // return fill(i);
          return 'red';
        })
        .attr('text-anchor', 'middle')
        .attr('transform', function (d) {
          return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')';
        })
        .text(function (d) {
          return d.text;
        });
    };
    this._initializeTagCloud();

    console.log('start the layt');
    this._layout.start();

  }

  invalidate() {
    console.log('invalidate the tag-cloud');
    this._render();

  }

  _render() {
    console.log('start the layout....');
    this._layout.start();
  }

  _initializeTagCloud() {

    this._layout = d3TagCloud();
    this._layout.size([500, 500]);
    this._layout.words([
      'Hello', 'world', 'normally', 'you', 'want', 'more', 'words',
      'than', 'this'].map(function (d) {return {text: d, size: 10 + Math.random() * 90, test: 'haha'};}));
    this._layout.padding(5);
    this._layout.rotate(function () {
      return ~~(Math.random() * 2) * 90;
    });
    this._layout.font('Impact');
    this._layout.fontSize(function (d) {
      return d.size;
    });
    this._layout.on('end', this._draw);

  }


  setOptions(options) {
    console.log('setting options');
    if (JSON.stringify(options) === JSON.stringify(this._options)) {
      return;
    }
    this._options = options;
    this.invalidate();
  }

  /**
   * Set size of the container
   * @param size
   */
  setSize(size) {
    this._size = size;
    this.invalidate();
  }

  /**
   * array of words
   */
  setData(data) {
    console.log('set data', data);
    this._words = this._d3SvgContainer.datum(data.tags);
    console.log('words', this._words);
    this._layout.words(this._words);
    this.invalidate();
  }


};
