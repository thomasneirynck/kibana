import d3 from 'd3';
import d3TagCloud from 'd3-cloud';

function getText(word) {
  console.log('getting text', word.text);
  return word.text;
}

function positionWord(word) {
  return 'translate(' + [word.x, word.y] + ')rotate(' + word.rotate + ')';
}

function getSize(tag) {
  return tag.size;
}


export default class TagCloud {

  constructor(element) {

    window.TC = this;
    this._element = element;
    this._d3SvgContainer = d3.select(element);
    this._svgGroup = this._d3SvgContainer.append('g');

  }

  /**
   * @param options
   */
  setOptions(options) {
    console.log('setting options');
    if (JSON.stringify(options) === JSON.stringify(this._options)) {
      return;
    }
    this._options = options;
    this.invalidate();
  }

  _onLayoutEnd(wordsWithLayout) {

    console.log('DRAW yo data!', JSON.stringify(wordsWithLayout));
    const width = this._layout.size()[0];
    const height = this._layout.size()[1];

    this._d3SvgContainer.attr('width', width);
    this._d3SvgContainer.attr('height', height);

    // const svgGroup = this._d3SvgContainer.append('g');
    // const svgGroup = this._d3SvgContainer.get('g');
    this._svgGroup.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    const textGroups = this._svgGroup.selectAll('text');
    const stage = textGroups.data(wordsWithLayout);
    const boundWords = stage.enter();

    const tags = boundWords.append('text');

    tags.style('font-size', function (d) {
      return d.size + 'px';
    });
    // svgText.style('font-family', 'Impact');
    tags.style('fill', function (d, i) {
      // return fill(i);
      return 'red';
    });
    tags.attr('text-anchor', 'middle');
    tags.attr('transform', positionWord);
    tags.text(getText);
  };

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
    // this._words = this._d3SvgContainer.datum(data.tags);
    this._words = data.map((tag) => {
      return {text: tag.text, size: 10 + Math.random() * 90};
    });
    // console.log('words', this._words);

    this.invalidate();
  }


  invalidate() {
    console.log('invalidate the tag-cloud');
    if (!this._words) {
      return;
    }
    this._render();
  }

  _render() {
    console.log('start the layout....');

    this._layout = d3TagCloud();
    this._layout.size([500, 500]);
    this._layout.padding(5);
    this._layout.rotate(function () {
      return ~~(Math.random() * 2) * 90;
    });
    this._layout.font('Sans-serif   ');
    this._layout.fontSize(getSize);
    this._layout.on('end', this._onLayoutEnd.bind(this));
    this._layout.words(this._words);

    this._layout.start();
  }


};
