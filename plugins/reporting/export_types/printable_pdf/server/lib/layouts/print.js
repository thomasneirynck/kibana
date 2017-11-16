import path from 'path';

export function printLayoutFactory(server) {
  const config = server.config();
  const captureConfig = config.get('xpack.reporting.capture');

  return {

    getCssOverridesPath() {
      return path.join(__dirname, 'print.css');
    },

    getBrowserViewport() {
      return captureConfig.viewport;
    },

    getBrowserZoom() {
      return captureConfig.zoom;
    },

    getViewport(itemsCount) {
      return {
        zoom: captureConfig.zoom,
        width: captureConfig.viewport.width,
        height: captureConfig.viewport.height * itemsCount,
      };
    },

    getElementSize() {
      return {
        width: captureConfig.viewport.width / captureConfig.zoom,
        height: captureConfig.viewport.height / captureConfig.zoom
      };
    },

    getPdfImageSize() {
      return {
        width: 500,
      };
    },

    getPdfPageOrientation() {
      return 'portrait';
    },

    getPdfPageSize() {
      return 'A4';
    },

    selectors: {
      screenshot: '[data-shared-item]',
      renderComplete: '[data-shared-item]',
      itemsCountAttribute: 'data-shared-items-count',
      isTimepickerEnabled: '[data-shared-timefilter=true]'
    }
  };
}