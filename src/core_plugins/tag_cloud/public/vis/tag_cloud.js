import d3 from 'd3';
import d3TagCloud from 'd3-cloud';

export default class TagCloud {

  constructor(element, size) {
    window.TC = this;
    this._element = element;
    this._d3SvgContainer = d3.select(element);
    this._svgGroup = this._d3SvgContainer.append('g');
    this._size = [1, 1];//initialize array
    this.setSize(size);
  }

  /**
   * @param options
   */
  setOptions(options) {
    if (JSON.stringify(options) === JSON.stringify(this._options)) {
      return;
    }
    this._options = options;
    this.invalidate();
  }

  _onLayoutEnd(resolve, reject, wordsWithLayout) {

    const svgTextNodes = this._svgGroup.selectAll('text');
    const stage = svgTextNodes.data(wordsWithLayout, getText);

    const enterSelection = stage.enter();
    const enteringTags = enterSelection.append('text');
    enteringTags.style('font-size', getSizeInPixels);
    enteringTags.style('font-family', 'Impact');
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
        this._viewDirtyPromise = null;
        resolve(true);
      }
    };
    exitTransition.each(_ => exits += 1);
    exitTransition.each('end', _ => {
      exits -= 1;
      checkIfDone();
    });
    movingTags.each(_ => moves += 1);
    movingTags.each('end', _ => {
      moves -= 1;
      checkIfDone();
    });

  };

  /**
   * Set size of the container
   * @param size
   */
  setSize(newSize) {
    if (newSize[0] === 0 || newSize[1] === 0) {
      return;
    }
    if (newSize[0] === this._size[0] && newSize[1] === this._size[1]) {
      return;
    }
    this._size = newSize;
    this.invalidate();
  }

  setData(data) {
    // this._words = this._d3SvgContainer.datum(data.tags);
    this._words = data.map((tag) => {
      return {text: tag.text, size: 10 + Math.random() * 90};
    });
    // console.log('words', this._words);

    this.invalidate();
  }

  destroy() {
    if (this._viewDirtyPromise) {
      //wait until ready.
    }
    this._element.innerHTML = '';
  }

  invalidate() {
    if (!this._words) {
      return;
    }
    this._render().then(_ => {
      //fire complete event here!
    });
  }

  _render() {

    const render = () => {
      this._viewDirtyPromise = new Promise((resolve, reject) => {

        const layout = d3TagCloud();
        layout.size(this._size);
        layout.padding(5);
        layout.rotate(function () {
          return ~~(Math.random() * 2) * 90;
        });
        layout.font(this._font);
        layout.fontSize(getSize);
        layout.on('end', this._onLayoutEnd.bind(this, resolve, reject));
        layout.words(this._words);

        this._d3SvgContainer.attr('width', this._size[0]);
        this._d3SvgContainer.attr('height', this._size[1]);
        this._svgGroup.attr('transform', 'translate(' + this._size[0] / 2 + ',' + this._size[1] / 2 + ')');

        layout.start();

      });
    };

    // if (this._viewDirtyPromise) {
    //   this._viewDirtyPromise.then(render);
    // } else {
    //   render();
    // }
    //
    // return this._viewDirtyPromise;

    render();
    return this._viewDirtyPromise;

  }


};


function getText(word) {
  return word.text;
}

function positionWord(word) {
  return 'translate(' + [word.x, word.y] + ')rotate(' + word.rotate + ')';
}

function getSize(tag) {
  return tag.size;
}

function getSizeInPixels(d) {
  return d.size + 'px';
}

function getFill(tag) {
  // return tag.fill;
  return 'red';
}
