import expect from 'expect.js';
import pixelmatch from 'pixelmatch';
import {KibanaMap} from '../../../tile_map/public/kibana_map';
import ChoroplethLayer from '../choropleth_layer';

describe('kibana_map tests', function () {

  let domNode;
  let expectCanvas;
  let kibanaMap;

  function setupDOM() {
    domNode = document.createElement('div');
    domNode.style.top = '0';
    domNode.style.left = '0';
    domNode.style.width = '512px';
    domNode.style.height = '512px';
    domNode.style.position = 'fixed';
    domNode.style['pointer-events'] = 'none';
    document.body.appendChild(domNode);

    expectCanvas = document.createElement('canvas');
    document.body.appendChild(expectCanvas);
  }

  function teardownDOM() {
    domNode.innerHTML = '';
    document.body.removeChild(domNode);
    document.body.removeChild(expectCanvas);
  }

  describe('choropleth layer', function () {

    beforeEach(async function () {
      setupDOM();
      kibanaMap = new KibanaMap(domNode, {
        minZoom: 1,
        maxZoom: 10
      });
      kibanaMap.setZoomLevel(3);
      kibanaMap.setCenter({
        lon: -100,
        lat: 40
      });
    });

    afterEach(function () {
      kibanaMap.destroy();
      teardownDOM();
    });


    it('test choropleth mapping', function (done) {

      const choroplethLayer = new ChoroplethLayer('https://layers.geo.elastic.co/blob/5659313586569216', 'foobar');
      choroplethLayer.setJoinField('iso2');
      kibanaMap.addLayer(choroplethLayer);


      choroplethLayer.setMetrics([{
        term: 'CN',
        value: 1000
      }, {
        term: 'US',
        value: 500
      }], {
        fieldFormatter: ()=> {
          return (e => e);
        }
      });


      // const geohashLayer = new GeohashLayer(GeoHashSampleData, choroplethOptions, kibanaMap.getZoomLevel(), kibanaMap);
      // kibanaMap.addLayer(geohashLayer);

      // Give time for canvas to render before checking output
      // window.setTimeout(() => {
      //   // Extract image data from live map
      //   const elementList = domNode.querySelectorAll('canvas');
      //   expect(elementList.length).to.equal(1);
      //   const canvas = elementList[0];
      //   const ctx = canvas.getContext('2d');
      //   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      //
      //   // convert expect PNG into pixel data by drawing in new canvas element
      //   expectCanvas.id = 'expectCursor';
      //   expectCanvas.width = canvas.width;
      //   expectCanvas.height = canvas.height;
      //   const imageEl = new Image();
      //   imageEl.onload = () => {
      //     const expectCtx = expectCanvas.getContext('2d');
      //     expectCtx.drawImage(imageEl, 0, 0, canvas.width, canvas.height);  // draw reference image to size of generated image
      //     const expectImageData = expectCtx.getImageData(0, 0, canvas.width, canvas.height);
      //
      //     // compare live map vs expected pixel data
      //     const diffImage = expectCtx.createImageData(canvas.width, canvas.height);
      //     const mismatchedPixels = pixelmatch(
      //       imageData.data,
      //       expectImageData.data,
      //       diffImage.data,
      //       canvas.width,
      //       canvas.height,
      //       {threshold: 0.1});
      //     expect(mismatchedPixels < 16).to.equal(true);
      //     // Display difference image for refernce
      //     expectCtx.putImageData(diffImage, 0, 0);
      //
      //     done();
      //   };
      //   imageEl.src = test.expected;
      //
      //   // Instructions for creating expected image PNGs
      //   // Comment out imageEl creation and image loading
      //   // Comment out teardown line that removes expectCanvas from DOM
      //   // Uncomment out below lines. Run test, right click canvas and select "Save Image As"
      //   // const expectCtx = expectCanvas.getContext('2d');
      //   // expectCtx.putImageData(imageData, 0, 0);
      //   // done();
      //
      // }, 200);

      setTimeout(() => {
        done();
      }, 8000);


    });

  });
});
