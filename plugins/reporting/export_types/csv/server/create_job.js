import { oncePerServer } from '../../../server/lib/once_per_server';
import { cryptoFactory } from '../../../server/lib/crypto';

function createJobFn(server) {
  const crypto = cryptoFactory(server);

  return async function createJob(jobParams, headers) {
    const serializedEncryptedHeaders = await crypto.encrypt(headers);

    return {
      headers: serializedEncryptedHeaders,
      ...jobParams
    };
  };
}

export const createJobFactory = oncePerServer(createJobFn);
