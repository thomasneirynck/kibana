import { createHash } from 'crypto';
import { createReadStream } from 'fs';

import { readableEnd } from './util';

export async function md5(path) {
  const hash = createHash('md5');
  await readableEnd(
    createReadStream(path)
      .on('data', chunk => hash.update(chunk))
  );
  return hash.digest('hex');
}
