import Rx from 'rxjs/Rx';
import { omit } from 'lodash';
import { oncePerServer } from '../../../server/lib/once_per_server';
import { generatePdfObservableFactory } from './lib/generate_pdf';
import { cryptoFactory } from '../../../server/lib/crypto';

const KBN_SCREENSHOT_HEADER_BLACKLIST = [
  'accept-encoding',
  'content-length',
  'content-type',
  'host',
];

function executeJobFn(server) {
  const generatePdfObservable = generatePdfObservableFactory(server);
  const crypto = cryptoFactory(server);

  const decryptJobHeaders = async (job) => {
    const decryptedHeaders = await crypto.decrypt(job.headers);
    return { job, decryptedHeaders };
  };

  const omitBlacklistedHeaders = ({ job, decryptedHeaders }) => {
    const filteredHeaders = omit(decryptedHeaders, KBN_SCREENSHOT_HEADER_BLACKLIST);
    return { job, filteredHeaders };
  };

  return function executeJob(jobToExecute, cancellationToken) {

    const process$ = Rx.Observable.of(jobToExecute)
      .mergeMap(decryptJobHeaders)
      .catch(() => Rx.Observable.throw('Failed to decrypt report job data. Please re-generate this report.'))
      .map(omitBlacklistedHeaders)
      .mergeMap(({ job, filteredHeaders }) => {
        return generatePdfObservable(job.title, job.objects, job.query, filteredHeaders, job.browserTimezone, job.layout);
      })
      .map(buffer => ({
        content_type: 'application/pdf',
        content: buffer.toString('base64')
      }));

    const stop$ = Rx.Observable.fromEventPattern(cancellationToken.on);

    return process$.takeUntil(stop$).toPromise();
  };
}

export const executeJobFactory = oncePerServer(executeJobFn);
