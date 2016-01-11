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

  addImage(filePath, opts) {
    if (opts.title) {
      this._content.push({
        text: opts.title,
        style: 'heading'
      });
    }

    if (opts.description) {
      this._content.push({
        text: opts.description,
        style: 'subheading'
      });
    }

    const img = {
      image: filePath,
      width: 480,
      alignment: 'left',
      margin: [ 0, 10, 0, 10 ],
    };

    this._content.push(_.assign(img, _.omit(opts, ['title', 'description'])));
  }

  generate() {
    const docTemplate = _.assign(getTemplate(), { content: this._content });
    this._pdfDoc = this._printer.createPdfKitDocument(docTemplate);
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

module.exports = {
  create: () => new PdfMaker(),
};
