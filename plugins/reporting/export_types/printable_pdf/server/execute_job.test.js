import { memoize } from 'lodash';
import { cryptoFactory } from '../../../server/lib/crypto';
import { executeJobFactory } from './execute_job';
import { generatePdfFactory } from './lib/generate_pdf';
jest.mock('./lib/generate_pdf', () => {
  const generatePdf = jest.fn().mockReturnValue({ getBuffer: () => Buffer.from('') });
  return {
    generatePdfFactory: jest.fn().mockReturnValue(generatePdf)
  };
});


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
  await expect(executeJob({})).rejects.toBeDefined();
});

test(`passes in decrypted headers to generatePdf`, async () => {
  const headers = {
    foo: 'bar',
    baz: 'quix',
  };

  const encryptedHeaders = await encryptHeaders(headers);
  const executeJob = executeJobFactory(mockServer);
  await executeJob({ headers: encryptedHeaders });

  const generatePdf = generatePdfFactory();
  expect(generatePdf).toBeCalledWith(undefined, undefined, undefined, headers, undefined);
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

  const encryptedHeaders = await encryptHeaders(Object.assign({}, permittedHeaders, blacklistedHeaders));

  const executeJob = executeJobFactory(mockServer);
  await executeJob({ headers: encryptedHeaders });

  const generatePdf = generatePdfFactory();
  expect(generatePdf).toBeCalledWith(undefined, undefined, undefined, permittedHeaders, undefined);
});

test(`returns content_type of application/pdf`, async () => {
  const executeJob = executeJobFactory(mockServer);
  const encryptedHeaders = await encryptHeaders({});
  const { content_type } = await executeJob({ headers: encryptedHeaders });
  expect(content_type).toBe('application/pdf');
});

test(`returns content of generatePdf getBuffer base64 encoded`, async () => {
  const testContent = 'test content';
  const generatePdf = generatePdfFactory();
  generatePdf.mockReturnValue({ getBuffer: () =>  Buffer.from(testContent) });

  const executeJob = executeJobFactory(mockServer);
  const encryptedHeaders = await encryptHeaders({});
  const { content } = await executeJob({ headers: encryptedHeaders });

  expect(content).toEqual(Buffer.from(testContent).toString('base64'));
});

