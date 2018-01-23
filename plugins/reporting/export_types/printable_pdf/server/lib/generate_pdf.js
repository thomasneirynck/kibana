import Rx from 'rxjs/Rx';
import { some } from 'lodash';
import { pdf } from './pdf';
import { oncePerServer } from '../../../../server/lib/once_per_server';
import { screenshotsObservableFactory } from './screenshots';
import { getLayoutFactory } from './layouts';

function generatePdfObservableFn(server) {
  const screenshotsObservable = screenshotsObservableFactory(server);
  const config = server.config();
  const captureConcurrency = config.get('xpack.reporting.capture.concurrency');
  const getLayout = getLayoutFactory(server);

  const urlScreenshotsObservable = (urls, headers, layout) => {
    return Rx.Observable
      .from(urls)
      .mergeMap(url => screenshotsObservable(url, headers, layout),
        (outer, inner) => inner,
        captureConcurrency
      );
  };


  const createPdfWithScreenshots = async ({ title, timeRange, urlScreenshots, layout, logo }) => {
    const pdfOutput = pdf.create(layout, logo);

    if (title) {
      const titleTimeRange = some(urlScreenshots, { isTimepickerEnabled: true }) ? timeRange : null;
      title += (titleTimeRange) ? ` — ${titleTimeRange.from} to ${titleTimeRange.to}` : '';
      pdfOutput.setTitle(title);
    }

    urlScreenshots.forEach(({ screenshots }) => {
      screenshots.forEach(screenshot => {
        pdfOutput.addImage(screenshot.base64EncodedData, {
          title: screenshot.title,
          description: screenshot.description,
        });
      });
    });

    pdfOutput.generate();
    const buffer = await pdfOutput.getBuffer();
    return buffer;
  };


  return function generatePdfObservable(title, urls, timeRange, headers, layoutParams, logo) {
    const layout = getLayout(layoutParams);
    const screenshots$ = urlScreenshotsObservable(urls, headers, layout);

    return screenshots$
      .toArray()
      .mergeMap(urlScreenshots => createPdfWithScreenshots({ title, timeRange, urlScreenshots, layout, logo }));
  };
}

export const generatePdfObservableFactory = oncePerServer(generatePdfObservableFn);
