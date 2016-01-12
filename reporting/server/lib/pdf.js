const path = require('path');
const _ = require('lodash');
const Printer = require('pdfmake');
const assetPath = path.resolve(__dirname, '..', '..', 'server', 'assets');

class PdfMaker {
  constructor(options) {
    const fontPath = (filename) => path.resolve(assetPath, 'fonts', filename);
    const fonts = {
      Roboto: {
        normal: fontPath('Roboto-Regular.ttf'),
        bold: fontPath('Roboto-Medium.ttf'),
        italics: fontPath('Roboto-Italic.ttf'),
        bolditalics: fontPath('Roboto-Italic.ttf'),
      }
    };

    this._content = [];
    this._printer = new Printer(fonts);
  }

  _addContents(contents) {
    const groupCount = this._content.length;

    // inject a page break for every 2 groups on the page
    if (groupCount > 0 && groupCount % 2 === 0) {
      contents = [{
        text: '',
        pageBreak: 'after',
      }].concat(contents);
    }

    this._content.push(contents);
  }

  addImage(filePath, opts = {}) {
    const contents = [];

    if (opts.title && opts.title.length > 0) {
      contents.push({
        text: opts.title,
        style: 'heading'
      });
    }

    if (opts.description && opts.description.length > 0) {
      contents.push({
        text: opts.description,
        style: 'subheading'
      });
    }

    const img = {
      image: filePath,
      width: 500,
      alignment: 'center',
    };

    const wrappedImg = {
      table: {
        body: [
          [ img ],
        ],
      },
      layout: 'simpleBorder'
    };

    contents.push(_.assign(wrappedImg, _.omit(opts, ['title', 'description'])));

    this._addContents(contents);
  }

  generate() {
    const docTemplate = _.assign(getTemplate(), { content: this._content });
    this._pdfDoc = this._printer.createPdfKitDocument(docTemplate, getDocOptions());
    return this;
  }

  getStream() {
    this._pdfDoc.end();
    return this._pdfDoc;
  }
};

function getTemplate() {
  const pageMarginTop = 60;
  const pageMarginBottom = 80;
  const pageMarginWidth = 40;

  return {
    // define page size
    pageOrientation: 'portrait',
    pageSize: 'A4',
    pageMargins: [ pageMarginWidth, pageMarginTop, pageMarginWidth, pageMarginBottom ],

    // header: function (currentPage, pageCount) {
    //   return {
    //     margin: [ pageMarginWidth, 0, pageMarginWidth, 0 ],
    //     text: 'I\'m a little header, short and stout',
    //     alignment: 'center'
    //   };
    // },

    footer: function (currentPage, pageCount) {
      const logoPath = path.resolve(assetPath, 'img', 'logo-grey.png');
      return {
        margin: [ pageMarginWidth, pageMarginBottom / 4, pageMarginWidth, 0 ],
        alignment: 'justify',
        columns: [
          {
            width: 100,
            image: logoPath,
          }, {
            margin: [ 120, 10, 0, 0 ],
            text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
            style: {
              color: '#888'
            },
          },
        ]
      };
    },

    styles: {
      heading: {
        alignment: 'left',
        fontSize: 22,
        bold: true
      },
      subheading: {
        alignment: 'left',
        italics: true,
        marginLeft: 20
      },
    }
  };
}

function getDocOptions() {
  return {
    tableLayouts: {
      simpleBorder: {
        hLineWidth: function (i, node) { return 1; },
        vLineWidth: function (i, node) { return 1; },
        hLineColor: function (i, node) { return 'silver'; },
        vLineColor: function (i, node) { return 'silver'; },
        paddingLeft: function (i, node) { return 0; },
        paddingRight: function (i, node) { return 0; },
        paddingTop: function (i, node) { return 0; },
        paddingBottom: function (i, node) { return 0; },
      }
    }
  };
}

module.exports = {
  create: () => new PdfMaker(),
};
