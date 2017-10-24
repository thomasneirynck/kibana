import Rx from 'rxjs/Rx';
import path from 'path';
import moment from 'moment';
import getPort from 'get-port';
import { LevelLogger } from './level_logger';

export function screenshotsObservableFactory(server) {
  const config = server.config();
  const logger = LevelLogger.createForServer(server, ['reporting', 'screenshots']);

  const browserDriverFactory = server.plugins.reporting.browserDriverFactory;
  const captureConfig = config.get('xpack.reporting.capture');
  const browserDriverConfig = captureConfig.browser[browserDriverFactory.type];

  const basePath = config.get('server.basePath');
  const dataDirectory = config.get('path.data');

  const itemSelector = '[data-shared-item]';
  const itemsCountAttribute = 'data-shared-items-count';

  const asyncDurationLogger = async (description, promise) => {
    const start = new Date();
    const result = await promise;
    logger.debug(`${description} took ${new Date() - start}ms`);
    return result;
  };

  const startRecording = (browser) => {
    if (captureConfig.record) {
      if (!browser.record) {
        throw new Error('Unable to record capture with current browser');
      }

      browser.record(path.join(dataDirectory, `recording-${moment().utc().format().replace(/:/g, '_')}`));
    }
  };

  const openUrl = async (browser, url, headers) => {
    const waitForSelector = '.application';

    await browser.open(url, {
      headers,
      waitForSelector,
    });
    return browser;
  };

  const injectCustomCss = async (browser) => {
    await browser.evaluate({
      fn: function (cssBasePath) {
        const cssPath = cssBasePath + '/plugins/reporting/styles/reporting-overrides.css';
        const node = document.createElement('link');
        node.rel = 'stylesheet';
        node.href = cssPath;
        document.getElementsByTagName('head')[0].appendChild(node);
      },
      args: [basePath],
    });
    return browser;
  };

  const waitForElementOrItemsCountAttribute = async (browser) => {
    // the dashboard is using the `itemsCountAttribute` attribute to let us
    // know how many items to expect since gridster incrementally adds panels
    // we have to use this hint to wait for all of them
    await browser.waitForSelector(`${itemSelector},[${itemsCountAttribute}]`);
    return browser;
  };

  const getNumberOfItems = async (browser) => {
    // returns the value of the `itemsCountAttribute` if it's there, otherwise
    // we just count the number of `itemSelector`
    const itemsCount = await browser.evaluate({
      fn: function (selector, countAttribute) {
        const elementWithCount = document.querySelector(`[${countAttribute}]`);
        if (elementWithCount) {
          return parseInt(elementWithCount.getAttribute(countAttribute));
        }

        return document.querySelectorAll(selector).length;
      },
      args: [itemSelector, itemsCountAttribute],
    });
    return { browser, itemsCount };
  };

  const waitForElementsToBeInDOM = async ({ browser, itemsCount }) => {
    await browser.waitFor({
      fn: function (selector) {
        return document.querySelectorAll(selector).length;
      },
      args: [itemSelector],
      toEqual: itemsCount
    });
    return { browser, itemsCount };
  };

  const setViewport = async ({ browser, itemsCount }) => {
    // we set the viewport of PhantomJS based on the number of visualizations
    // so that when we position them with fixed-positioning below, they're all visible
    await browser.setViewport({
      zoom: captureConfig.zoom,
      width: captureConfig.viewport.width,
      height: captureConfig.viewport.height * itemsCount,
    });
    return browser;
  };

  const positionElements = async (browser) => {
    await browser.evaluate({
      fn: function (selector, height, width) {
        const visualizations = document.querySelectorAll(selector);
        const visualizationsLength = visualizations.length;

        for (let i = 0; i < visualizationsLength; i++) {
          const visualization = visualizations[i];
          const style = visualization.style;
          style.position = 'fixed';
          style.top = `${height * i}px`;
          style.left = 0;
          style.width = `${width}px`;
          style.height = `${height}px`;
          style.zIndex = 1;
          style.backgroundColor = 'inherit';
        }
      },
      args: [itemSelector, captureConfig.viewport.height / captureConfig.zoom, captureConfig.viewport.width / captureConfig.zoom],
    });
    return browser;
  };

  const waitForRenderComplete = async (browser) => {
    await browser.evaluate({
      fn: function (selector, visLoadDelay, visSettleTime) {
        // wait for visualizations to finish loading
        const visualizations = document.querySelectorAll(selector);
        const visCount = visualizations.length;
        const renderedTasks = [];

        // used when visualizations have a render-count attribute
        function waitForRenderCount(visualization) {
          return new Promise(function (resolve) {
            const CHECK_DELAY = 300;
            let lastRenderCount = 0;

            (function checkRenderCount() {
              const renderCount = parseInt(visualization.getAttribute('render-counter'));

              // vis has rendered at least once
              if (renderCount > 0) {
                // resolve once the current and previous render count match
                if (renderCount === lastRenderCount) {
                  return resolve();
                }

                // if they don't match, wait for the visualization to settle and try again
                lastRenderCount = renderCount;
                return setTimeout(checkRenderCount, visSettleTime);
              }

              setTimeout(checkRenderCount, CHECK_DELAY);
            }());
          });
        }

        // timeout resolution, used when visualizations don't have a render-count attribute
        function waitForRenderDelay() {
          return new Promise(function (resolve) {
            setTimeout(resolve, visLoadDelay);
          });
        }

        for (let i = 0; i < visCount; i++) {
          const visualization = visualizations[i];
          const renderCounter = visualization.getAttribute('render-counter');

          if (renderCounter !== 'disabled') {
            renderedTasks.push(waitForRenderCount(visualization));
          } else {
            renderedTasks.push(waitForRenderDelay());
          }
        }

        return Promise.all(renderedTasks);
      },
      args: [itemSelector, captureConfig.loadDelay, captureConfig.settleTime],
      awaitPromise: true,
    });
    return browser;
  };

  const getIsTimepickerEnabled = async (browser) => {
    const isTimepickerEnabled = await browser.evaluate({
      fn: function (selector) {
        return document.querySelector(selector) !== null;
      },
      args: ['[data-shared-timefilter=true]']
    });
    return { browser, isTimepickerEnabled };
  };

  const getElementPositionAndAttributes = async ({ browser, isTimepickerEnabled }) => {
    const elementsPositionAndAttributes = await browser.evaluate({
      fn: function (selector, attributes) {
        const elements = document.querySelectorAll(selector);

        // NodeList isn't an array, just an iterator, unable to use .map/.forEach
        const results = [];
        for (const element of elements) {
          const boundingClientRect = element.getBoundingClientRect();
          results.push({
            position: {
              boundingClientRect: {
                // modern browsers support x/y, but older ones don't
                top: boundingClientRect.y || boundingClientRect.top,
                left: boundingClientRect.x || boundingClientRect.left,
                width: boundingClientRect.width,
                height: boundingClientRect.height,
              },
              scroll: {
                x: window.scrollX,
                y: window.scrollY
              }
            },
            attributes: Object.keys(attributes).reduce((result, key) => {
              const attribute = attributes[key];
              result[key] = element.getAttribute(attribute);
              return result;
            }, {})
          });
        }
        return results;

      },
      args: [itemSelector, { title: 'data-title', description: 'data-description' }],
      returnByValue: true,
    });
    return { browser, isTimepickerEnabled, elementsPositionAndAttributes, };
  };

  const getScreenshots = async ({ browser, isTimepickerEnabled, elementsPositionAndAttributes }) => {
    const screenshots = [];
    for (const item of elementsPositionAndAttributes) {
      const base64EncodedData = await asyncDurationLogger('screenshot', browser.screenshot(item.position));
      screenshots.push({
        base64EncodedData,
        title: item.attributes.title,
        description: item.attributes.description
      });
    }
    return { screenshots, isTimepickerEnabled };
  };

  return function screenshotsObservable(url, headers) {

    return Rx.Observable
      .defer(async () => {
        return await getPort();
      })
      .mergeMap(bridgePort => {
        return browserDriverFactory.create({
          bridgePort,
          viewport: captureConfig.viewport,
          zoom: captureConfig.zoom,
          logger,
          config: browserDriverConfig
        });
      })
      .mergeMap(({ driver$, exit$, message$, consoleMessage$ }) => {

        message$.subscribe(line => {
          logger.debug(line, ['browser']);
        });

        consoleMessage$.subscribe(line => {
          logger.debug(line, ['browserConsole']);
        });

        const screenshot$ = driver$
          .do(startRecording)
          .do(() => logger.debug(`opening ${url}`))
          .mergeMap(browser => openUrl(browser, url, headers))
          .do(() => logger.debug('injecting custom css'))
          .mergeMap(injectCustomCss)
          .do(() => logger.debug('waiting for elements or items count attribute'))
          .mergeMap(waitForElementOrItemsCountAttribute)
          .do(() => logger.debug('determining how many items we have'))
          .mergeMap(getNumberOfItems)
          .do(({ itemsCount }) => logger.debug(`waiting for ${itemsCount} to be in the DOM`))
          .mergeMap(waitForElementsToBeInDOM)
          .do(() => logger.debug('setting viewport'))
          .mergeMap(setViewport)
          .do(() => logger.debug('positioning elements'))
          .mergeMap(positionElements)
          .do(() => logger.debug('waiting for rendering to complete'))
          .mergeMap(waitForRenderComplete)
          .do(() => logger.debug('rendering is complete'))
          .mergeMap(getIsTimepickerEnabled)
          .do(({ isTimepickerEnabled }) => logger.debug(`the time picker ${isTimepickerEnabled ? 'is' : `isn't`} enabled`))
          .mergeMap(getElementPositionAndAttributes)
          .do(() => logger.debug(`taking screenshots`))
          .mergeMap(getScreenshots);

        return Rx.Observable.race(screenshot$, exit$);
      })
      .first();
  };
}
