import { unlink } from 'fs';
import { capitalize, some } from 'lodash';
import { getTimeFilterRange } from './get_time_filter_range';
import { pdf } from './pdf';
import { oncePerServer } from '../../../../server/lib/once_per_server';
import { getScreenshotFactory } from './get_screenshot';
import { getAbsoluteUrlFactory } from './get_absolute_url';

function generatePdfFn(server) {
  const getScreenshot = getScreenshotFactory(server);
  const warningLog = (msg) => server.log(['reporting', 'warning'], msg);
  const getAbsoluteUrl = getAbsoluteUrlFactory(server);

  function cleanImages(cleanupPaths) {
    return Promise.all(cleanupPaths.map(imagePath => {
      return new Promise((resolve, reject) => {
        return unlink(imagePath, (err) => {
          if (err) { return reject(err); }
          resolve();
        });
      });
    }))
    .catch((err) => {
      // any failures to remove images are silently swallowed
      warningLog(`Failed to remove screenshot image: ${err.path}`);
    });
  }

  function getUrl(savedObj) {
    if (savedObj.urlHash) {
      return getAbsoluteUrl(savedObj.urlHash);
    }

    if (savedObj.url.startsWith(getAbsoluteUrl())) {
      return savedObj.url;
    }

    throw new Error(`Unable to generate report for url ${savedObj.url}, it's not a Kibana URL`);
  }

  return function generatePdf(title, savedObjects, query, headers, browserTimezone) {
    const pdfOutput = pdf.create();

    return Promise.all(savedObjects.map((savedObj) => {
      if (savedObj.isMissing) {
        return  { savedObj };
      } else {
        return getScreenshot(getUrl(savedObj), savedObj.type, headers)
        .then(({ isTimepickerEnabled, screenshots }) => {
          server.log(['reporting', 'debug'], `${savedObj.id} -> ${JSON.stringify(screenshots)}`);
          return { isTimepickerEnabled, screenshots, savedObj };
        });
      }
    }))
    .then(objects => {
      const cleanupPaths = [];

      if (title) {
        const timeRange = some(objects, { isTimepickerEnabled: true }) ? getTimeFilterRange(browserTimezone, query) : null;
        title += (timeRange) ? ` — ${timeRange.from} to ${timeRange.to}` : '';
        pdfOutput.setTitle(title);
      }

      objects.forEach(object => {
        const { screenshots, savedObj } = object;
        if (screenshots) cleanupPaths.push.apply(cleanupPaths, screenshots.map(s => s.filepath));

        if (savedObj.isMissing) {
          pdfOutput.addHeading(`${capitalize(savedObj.type)} with id '${savedObj.id}' not found`, {
            styles: 'warning'
          });
        } else {
          screenshots.forEach(screenshot => {
            pdfOutput.addImage(screenshot.filepath, {
              title: screenshot.title,
              description: screenshot.description,
            });
          });
        }
      });

      return cleanupPaths;
    })
    .then(cleanupPaths => {
      try {
        const pdfInstance = pdfOutput.generate();
        return cleanImages(cleanupPaths).then(() => pdfInstance);
      } catch (err) {
        return cleanImages(cleanupPaths).then(() => { throw err; });
      }
    });
  };
}

export const generatePdfFactory = oncePerServer(generatePdfFn);
