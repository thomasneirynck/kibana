import d3 from 'd3';
import d3TagCloud from 'd3-cloud';
import vislibComponentsSeedColorsProvider from 'ui/vislib/components/color/seed_colors';
import {EventEmitter} from 'events';


const ORIENTATIONS = {
  single: () => 0,
  rightAngled: (tag) => {
    return hashCode(tag.text) % 2 * 90;
  },
  multi: (tag) => {
    return (~~(hashCode(tag.text) % 12) * 15) - 90;
  }
};
const D3_SCALING_FUNCTIONS = {
  linear: d3.scale.linear(),
  log: d3.scale.log(),
  sqrt: d3.scale.sqrt()
};


export default class TagCloud extends EventEmitter {

  constructor(domNode) {

    super();

    this._element = domNode;
    this._d3SvgContainer = d3.select(this._element).append('svg');
    this._svgGroup = this._d3SvgContainer.append('g');
    this._size = [1, 1];
    this.resize();

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
    this._invalidate(false);
  }


  resize() {

    const newWidth = this._element.offsetWidth;
    const newHeight = this._element.offsetHeight;

    if (newWidth < 1 || newHeight < 1) {
      return;
    }

    if (newWidth === this._size[0] && newHeight === this._size[1]) {
      return;
    }

    const didOverflow = this._size[0] < this._cloudWidth || this._size[1] < this._cloudHeight;
    const willNotOverflow = this._cloudWidth <= newWidth && this._cloudHeight <= newHeight;

    this._size[0] = newWidth;
    this._size[1] = newHeight;

    if (!didOverflow && willNotOverflow) {
      this._invalidate(true);
    } else {
      this._washWords();
      this._invalidate(false);
    }



  }

  setData(data) {
    this._words = data.map(toWordTag);
    this._makeTextSizeMapper();
    this._invalidate(false);
  }


  destroy() {
    clearTimeout(this._timeoutHandle);
    this._element.innerHTML = '';
  }

  async whenRendered() {

    if (this._dirtyPromise) {//rendering is in-flight
      return this._dirtyPromise;
    }

    return new Promise(resolve => {
      resolve(true);
    });
  }

  _updateContainerSize() {
    this._d3SvgContainer.attr('width', this._size[0]);
    this._d3SvgContainer.attr('height', this._size[1]);
    this._svgGroup.attr('width', this._size[0]);
    this._svgGroup.attr('height', this._size[1]);
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

  _onLayoutEnd() {

    const affineTransform = positionWord.bind(null, this._element.offsetWidth / 2, this._element.offsetHeight / 2);
    const svgTextNodes = this._svgGroup.selectAll('text');
    const stage = svgTextNodes.data(this._words, getText);

    const enterSelection = stage.enter();
    const enteringTags = enterSelection.append('text');
    enteringTags.style('font-size', getSizeInPixels);
    enteringTags.style('font-style', this._fontStyle);
    enteringTags.style('font-weight', () => this._fontWeight);
    enteringTags.style('font-family', () => this._fontFamily);
    enteringTags.style('fill', getFill);
    enteringTags.attr('text-anchor', () => 'middle');
    enteringTags.attr('transform', affineTransform);
    enteringTags.text(getText);

    const self = this;
    enteringTags.on({
      click: function (event) {
        self.emit('select', event.text);
      },
      mouseover: function (d) {
        d3.select(this).style('cursor', 'pointer');
      },
      mouseout: function (d) {
        d3.select(this).style('cursor', 'default');
      }
    });

    const movingTags = stage.transition();
    movingTags.duration(600);
    movingTags.style('font-size', getSizeInPixels);
    movingTags.style('font-style', this._fontStyle);
    movingTags.style('font-weight', () => this._fontWeight);
    movingTags.style('font-family', () => this._fontFamily);
    movingTags.attr('transform', affineTransform);

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
        const cloudBBox = this._svgGroup[0][0].getBBox();
        this._cloudWidth = cloudBBox.width;
        this._cloudHeight = cloudBBox.height;
        this._dirtyPromise = null;
        this._resolve(true);
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

  };


  _makeTextSizeMapper() {
    this._mapSizeToFontSize = D3_SCALING_FUNCTIONS[this._textScale];
    this._mapSizeToFontSize.range([this._minFontSize, this._maxFontSize]);
    if (this._words) {
      this._mapSizeToFontSize.domain(d3.extent(this._words, getSize));
    }
  }

  _invalidate(keepLayout) {


    if (!this._words) {
      return;
    }

    if (!this._dirtyPromise) {
      this._dirtyPromise = new Promise((resolve, reject) => {
        this._resolve = resolve;
      });
    }

    clearTimeout(this._timeoutHandle);
    this._timeoutHandle = requestAnimationFrame(() => {
      this._timeoutHandle = null;
      this._updateContainerSize();
      if (keepLayout) {
        this._onLayoutEnd();
      } else {
        this._updateLayout();
      }
    });
  }

  _updateLayout() {

    const tagCloudLayoutGenerator = d3TagCloud();
    tagCloudLayoutGenerator.size(this._size);
    tagCloudLayoutGenerator.padding(this._padding);
    tagCloudLayoutGenerator.rotate(ORIENTATIONS[this._orientations]);
    tagCloudLayoutGenerator.font(this._fontFamily);
    tagCloudLayoutGenerator.fontStyle(this._fontStyle);
    tagCloudLayoutGenerator.fontWeight(this._fontWeight);
    tagCloudLayoutGenerator.fontSize(tag => this._mapSizeToFontSize(tag.size));
    tagCloudLayoutGenerator.random(seed);
    tagCloudLayoutGenerator.spiral('archimedean');
    tagCloudLayoutGenerator.words(this._words);
    tagCloudLayoutGenerator.text(getText);
    tagCloudLayoutGenerator.timeInterval(100);//never run longer than 100ms at each interval
    tagCloudLayoutGenerator.on('end', this._onLayoutEnd.bind(this));
    tagCloudLayoutGenerator.start();

  }

};

function seed() {
  return 0.5;//constant seed for constant layouts
}

function toWordTag(word) {
  return {size: word.size, text: word.text};
}


function getText(word) {
  return word.text;
}

function positionWord(xTranslate, yTranslate, word) {
  return `translate(${word.x + xTranslate}, ${word.y + yTranslate})rotate(${word.rotate})`;
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

/**
 * Hash a string to a number. Removes random element
 * Retrieved from http://stackoverflow.com/questions/26057572/string-to-unique-hash-in-javascript-jquery
 * @param string
 */
function hashCode(str) {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
