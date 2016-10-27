import d3 from 'd3';
import d3TagCloud from 'd3-cloud';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';


const ORIENTATIONS = {
  single: () => 0,
  rightAngled: () =>~~(Math.random() * 2) * 90,
  multi: () => (~~(Math.random() * 12) * 15) - 90
};
const D3_SCALING_FUNCTIONS = {
  linear: d3.scale.linear(),
  log: d3.scale.log(),
  sqrt: d3.scale.sqrt()
};


export default class TagCloud {

  constructor(element, size) {
    this._element = element;
    this._d3SvgContainer = d3.select(element);
    this._svgGroup = this._d3SvgContainer.append('g');
    this._size = [1, 1];
    this.setSize(size);

    this._fontFamily = 'Impact';
    this._fontStyle = 'normal';
    this._fontWeight = 'normal';
    this._orientations = 'single';
    this._minFontSize = 10;
    this._maxFontSize = 36;
    this._textScale = 'linear';
    this._padding = 5;
  }

  setOptions(options) {
    if (JSON.stringify(options) === this._optionsAsString) {
      return;
    }

    this._optionsAsString = JSON.stringify(options);
    this._fontStyle = options.fontStyle;
    this._fontWeight = options.fontWeight;
    this._orientations = options.orientations;
    this._minFontSize = Math.min(options.minFontSize, options.maxFontSize);
    this._maxFontSize = Math.max(options.minFontSize, options.maxFontSize);
    this._textScale = options.textScale;

    this._washWords();
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
    if (this._complete && this._cloudWidth < this._size[0] && this._cloudHeight < this._size[1]) {
      this._updateContainerSize();
      return;
    }

    this._washWords();
    this._invalidate();

  }

  setData(data) {
    this._words = data.map(toWordTag);
    this._makeTextSizeMapper();
    this._invalidate();
  }


  destroy() {
    cancelAnimationFrame(this._domManipulationFrame);
    clearTimeout(this._timeoutHandle);
    this._element.innerHTML = '';
  }


  _updateContainerSize() {
    this._d3SvgContainer.attr('width', this._size[0]);
    this._d3SvgContainer.attr('height', this._size[1]);
    this._svgGroup.attr('width', this._size[0]);
    this._svgGroup.attr('height', this._size[1]);
    this._svgGroup.attr('transform', 'translate(' + this._size[0] / 2 + ',' + this._size[1] / 2 + ')');
  }

  _washWords() {
    if (!this._words) {
      return;
    }

    //the tagCloudLayoutGenerator clobbers the word-object with metadata about positioning.
    //This can causes corrupt states in the layout-generator
    //where words get collapsed to the same location and do not reposition correctly.
    //=> we recreate an empty word object without the metadata
    this._words = this._words.map(toWordTag);
    this._makeTextSizeMapper();
  }

  _onLayoutEnd(resolve, reject, wordsWithLayout) {
    this._domManipulationFrame = null;
    const svgTextNodes = this._svgGroup.selectAll('text');
    const stage = svgTextNodes.data(wordsWithLayout, getText);

    const enterSelection = stage.enter();
    const enteringTags = enterSelection.append('text');
    enteringTags.style('font-size', getSizeInPixels);
    enteringTags.style('font-style', this._fontStyle);
    enteringTags.style('font-weight', () => this._fontWeight);
    enteringTags.style('font-family', () => this._fontFamily);
    enteringTags.style('fill', getFill);
    enteringTags.attr('text-anchor', () => 'middle');
    enteringTags.attr('transform', positionWord);
    enteringTags.text(getText);

    const movingTags = stage.transition();
    movingTags.duration(600);
    movingTags.style('font-size', getSizeInPixels);
    movingTags.style('font-style', this._fontStyle);
    movingTags.style('font-weight', () => this._fontWeight);
    movingTags.style('font-family', () => this._fontFamily);
    movingTags.attr('transform', positionWord);

    const exitingTags = stage.exit();
    const exitTransition = exitingTags.transition();
    exitTransition.duration(200);
    exitingTags.style('fill-opacity', 1e-6);
    exitingTags.attr('font-size', 1);
    exitingTags.remove();

    let exits = 0;
    let moves = 0;
    const resolveWhenDone = () => {
      if (exits === 0 && moves === 0) {
        resolve(true);
      }
    };
    exitTransition.each(_ => exits++);
    exitTransition.each('end', () => {
      exits--;
      resolveWhenDone();
    });
    movingTags.each(_ => moves++);
    movingTags.each('end', () => {
      moves--;
      resolveWhenDone();
    });

    const cloudBBox = this._svgGroup[0][0].getBBox();
    this._cloudWidth = cloudBBox.width;
    this._cloudHeight = cloudBBox.height;
    this._complete = this._svgGroup[0][0].childNodes.length === this._words.length;

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
    cancelAnimationFrame(this._domManipulationFrame);
    this._timeoutHandle = setTimeout(() => {
      this._timeoutHandle = null;
      this._updateLayout();
    }, 100);
  }


  _updateLayout() {

    this._updateContainerSize();

    const tagCloudLayoutGenerator = d3TagCloud();
    tagCloudLayoutGenerator.size(this._size);
    tagCloudLayoutGenerator.padding(this._padding);
    tagCloudLayoutGenerator.rotate(ORIENTATIONS[this._orientations]);
    tagCloudLayoutGenerator.font(this._fontFamily);
    tagCloudLayoutGenerator.fontStyle(this._fontStyle);
    tagCloudLayoutGenerator.fontWeight(this._fontWeight);
    tagCloudLayoutGenerator.fontSize(tag => this._mapSizeToFontSize(tag.size));
    tagCloudLayoutGenerator.random(() => 0.5); //consistently seed the layout
    tagCloudLayoutGenerator.spiral('archimedean');
    tagCloudLayoutGenerator.words(this._words);
    tagCloudLayoutGenerator.text(getText);
    tagCloudLayoutGenerator.timeInterval(1000);//never run longer than a second

    return new Promise((resolve, reject) => {
      tagCloudLayoutGenerator.on('end', (words) => {
        cancelAnimationFrame(this._domManipulationFrame);
        this._domManipulationFrame = requestAnimationFrame(()=> {
          this._onLayoutEnd(resolve, reject, words);
        });
      });
      tagCloudLayoutGenerator.start();
    });
  }

};

function toWordTag(word) {
  return {size: word.size, text: word.text};
}


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
  return `${tag.size}px`;
}

const colorScale = d3.scale.ordinal().range(vislibComponentsSeedColorsProvider());
function getFill(tag) {
  return colorScale(tag.text);
}
