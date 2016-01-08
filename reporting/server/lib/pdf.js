const path = require('path');
const _ = require('lodash');
const pdfmake = require('pdfmake');
const pageMarginTop = 60;
const pageMarginBottom = 80;
const pageMarginWidth = 40;
const logoPath = path.resolve('server', 'assets', 'img', 'logo-grey.png');

const content = [
  'No styling here, this is a standard paragraph',
  { text: 'This is a heading', style: 'header' },
  { text: 'Multiple styles applied', style: [ 'header', 'rightItalics' ] }
];

const docTemplate = {
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
    header: {
      fontSize: 22,
      bold: true
    },
    rightItalics: {
      italics: true,
      alignment: 'right'
    }
  }
};

module.exports = function () {
  const pdfContent = _.assign({}, docTemplate, { content: content });
  return _.cloneDeep(pdfContent);
};