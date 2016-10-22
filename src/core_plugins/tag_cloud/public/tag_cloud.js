import d3 from 'd3';
import d3TagCloud from 'd3-cloud';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';


const ORIENTATIONS = {
  'single': (tag) => 0,
  'rightAngled': (tag) =>~~(Math.random() * 2) * 90,
  'multi': (tag) => ~~(Math.random() * 6) * 15
};
const D3_SCALING_FUNCTIONS = {
  'linear': d3.scale.linear(),
  'log': d3.scale.log(),
  'sqrt': d3.scale.sqrt()
};


export default class TagCloud {

  constructor(element, size) {

    this._element = element;
    this._d3SvgContainer = d3.select(element);
    this._svgGroup = this._d3SvgContainer.append('g');

    this._fontFamily = 'Impact';
    this._fontStyle = 'normal';
    this._fontWeight = 'normal';
    this._orientations = 'single';

    this._minFontSize = 10;
    this._maxFontSize = 36;
    this._textScale = 'linear';


    this._size = [1, 1];
    this.setSize(size);
  }

  setOptions(options) {

    if (JSON.stringify(options) === this._optionBackup) {
      //todo: super hacky
      return;
    }

    this._optionBackup = JSON.stringify(options);
    this._fontStyle = options.fontStyle;
    this._fontWeight = options.fontWeight;
    this._orientations = options.orientations;

    this._minFontSize = Math.min(options.minFontSize, options.maxFontSize);
    this._maxFontSize = Math.max(options.minFontSize, options.maxFontSize);
    this._textScale = options.textScale;
    this._makeTextSizeMapper();

    this._invalidate();
  }

  setSize(newSize) {
    if (newSize[0] === 0 || newSize[1] === 0) {
      return;
    }
    if (newSize[0] === this._size[0] && newSize[1] === this._size[1]) {
      return;
    }

    this._size = newSize;
    this._d3SvgContainer.attr('width', this._size[0]);
    this._d3SvgContainer.attr('height', this._size[1]);
    this._svgGroup.attr('height', this._size[1]);
    this._svgGroup.attr('height', this._size[1]);
    this._svgGroup.attr('transform', 'translate(' + this._size[0] / 2 + ',' + this._size[1] / 2 + ')');

    this._invalidate();
  }

  setData(data) {
    this._words = data.map(word => {
      return {
        size: word.size,
        text: word.text,
        orientation: null
      };
    });
    this._makeTextSizeMapper();
    this._invalidate();
  }


  destroy() {
    //need to interrupt any ongoing rendering.
    this._element.innerHTML = '';
  }

  _onLayoutEnd(resolve, reject, wordsWithLayout) {

    const svgTextNodes = this._svgGroup.selectAll('text');
    const stage = svgTextNodes.data(wordsWithLayout, getText);

    const enterSelection = stage.enter();
    const enteringTags = enterSelection.append('text');
    enteringTags.style('font-size', getSizeInPixels);
    enteringTags.style('font-style', this._fontStyle);
    enteringTags.style('font-weight', this._fontWeight);
    enteringTags.style('font-family', this._fontFamily);
    enteringTags.style('fill', getFill);
    enteringTags.attr('text-anchor', 'middle');
    enteringTags.attr('transform', positionWord);
    enteringTags.text(getText);

    const movingTags = stage.transition();
    movingTags.duration(600);
    movingTags.style('font-size', getSizeInPixels);
    movingTags.attr('transform', positionWord);
    movingTags.style('fill-opacity', 1);

    const exitingTags = stage.exit();
    const exitTransition = exitingTags.transition();
    exitTransition.duration(200);
    exitingTags.style('fill-opacity', 1e-6);
    exitingTags.attr('font-size', 1);
    exitingTags.remove();

    let exits = 0;
    let moves = 0;
    const checkIfDone = () => {
      if (exits === 0 && moves === 0) {
        resolve(true);
      }
    };
    exitTransition.each(_ => exits += 1);
    exitTransition.each('end', () => {
      exits -= 1;
      checkIfDone();
    });
    movingTags.each(_ => moves += 1);
    movingTags.each('end', () => {
      moves -= 1;
      checkIfDone();
    });

  };


  _makeTextSizeMapper() {
    this._mapSizeToFontSize = D3_SCALING_FUNCTIONS[this._textScale];
    this._mapSizeToFontSize.range([this._minFontSize, this._maxFontSize]);
    if (this._words) {
      this._mapSizeToFontSize.domain(d3.extent(this._words, getSize));
    }
  }


  _invalidate() {

    if (!this._words) {
      return;
    }

    clearTimeout(this._timeoutHandle);
    this._timeoutHandle = setTimeout(() => {
      this._render().then(() => console.log('done.. requires some massaging to deal with multiple renderings..'));
    }, 1000);

  }

  _render() {

    return new Promise((resolve, reject) => {

      const tagCloud = d3TagCloud();

      tagCloud.size(this._size);
      tagCloud.padding(5);
      tagCloud.rotate(ORIENTATIONS[this._orientations]);
      tagCloud.font(this._fontFamily);
      tagCloud.fontStyle(this._fontStyle);
      tagCloud.fontWeight(this._fontWeight);
      tagCloud.fontSize(tag =>this._mapSizeToFontSize(tag.size));
      tagCloud.random(_ => 0.5); //consistently seed the layout
      tagCloud.spiral('archimedean');
      tagCloud.words(this._words);
      tagCloud.timeInterval(1000);//never run longer than a second
      tagCloud.on('end', this._onLayoutEnd.bind(this, resolve, reject));
      tagCloud.start();

    });
  }

};


function getText(word) {
  return word.text;
}

function positionWord(word) {
  return `translate(${word.x}, ${word.y})rotate(${word.rotate})`;
}

function getSize(tag) {
  return tag.size;
}

function getSizeInPixels(tag) {
  return tag.size + 'px';
}

const colorScale = d3.scale.ordinal().range(vislibComponentsSeedColorsProvider());
function getFill(tag) {
  return colorScale(tag.text);
}
