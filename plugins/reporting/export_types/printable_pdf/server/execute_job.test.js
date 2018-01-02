import Rx from 'rxjs';
import { memoize } from 'lodash';
import { cryptoFactory } from '../../../server/lib/crypto';
import { executeJobFactory } from './execute_job';
import { generatePdfObservableFactory } from './lib/generate_pdf';

jest.mock('./lib/generate_pdf', () => {
  const generatePdfObserable = jest.fn();
  return {
    generatePdfObservableFactory: jest.fn().mockReturnValue(generatePdfObserable)
  };
});

const cancellationToken = {
  on: jest.fn()
};

let mockServer;
beforeEach(() => {
  mockServer = {
    expose: () => {},
    config: memoize(() => ({ get: jest.fn() }))
  };

  mockServer.config().get.mockImplementation((key) => {
    return {
      'xpack.reporting.encryptionKey': 'testencryptionkey'
    }[key];
  });
});

const encryptHeaders = async (headers) => {
  const crypto = cryptoFactory(mockServer);
  return await crypto.encrypt(headers);
};


test(`fails if it can't decrypt headers`, async () => {
  const executeJob = executeJobFactory(mockServer);
  await expect(executeJob({}, cancellationToken)).rejects.toBeDefined();
});

test(`passes in decrypted headers to generatePdf`, async () => {
  const headers = {
    foo: 'bar',
    baz: 'quix',
  };

  const generatePdfObservable = generatePdfObservableFactory();
  generatePdfObservable.mockReturnValue(Rx.Observable.of(Buffer.from('')));

  const encryptedHeaders = await encryptHeaders(headers);
  const executeJob = executeJobFactory(mockServer);
  await executeJob({ headers: encryptedHeaders }, cancellationToken);

  expect(generatePdfObservable).toBeCalledWith(undefined, undefined, undefined, headers, undefined, undefined);
});

test(`omits blacklisted headers`, async () => {
  const permittedHeaders = {
    foo: 'bar',
    baz: 'quix',
  };

  const blacklistedHeaders = {
    'accept-encoding': '',
    'content-length': '',
    'content-type': '',
    'host': '',
  };

  const encryptedHeaders = await encryptHeaders({
    ...permittedHeaders,
    ...blacklistedHeaders
  });

  const generatePdfObservable = generatePdfObservableFactory();
  generatePdfObservable.mockReturnValue(Rx.Observable.of(Buffer.from('')));

  const executeJob = executeJobFactory(mockServer);
  await executeJob({ headers: encryptedHeaders }, cancellationToken);

  expect(generatePdfObservable).toBeCalledWith(undefined, undefined, undefined, permittedHeaders, undefined, undefined);
});

test(`returns content_type of application/pdf`, async () => {
  const executeJob = executeJobFactory(mockServer);
  const encryptedHeaders = await encryptHeaders({});

  const generatePdfObservable = generatePdfObservableFactory();
  generatePdfObservable.mockReturnValue(Rx.Observable.of(Buffer.from('')));

  const { content_type: contentType } = await executeJob({ headers: encryptedHeaders }, cancellationToken);
  expect(contentType).toBe('application/pdf');
});

test(`returns content of generatePdf getBuffer base64 encoded`, async () => {
  const testContent = 'test content';

  const generatePdfObservable = generatePdfObservableFactory();
  generatePdfObservable.mockReturnValue(Rx.Observable.of(Buffer.from(testContent)));

  const executeJob = executeJobFactory(mockServer);
  const encryptedHeaders = await encryptHeaders({});
  const { content } = await executeJob({ headers: encryptedHeaders }, cancellationToken);

  expect(content).toEqual(Buffer.from(testContent).toString('base64'));
});

