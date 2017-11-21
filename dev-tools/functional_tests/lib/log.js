import { resolveKibanaPath } from '@elastic/plugin-helpers';

const { createToolingLog } = require(resolveKibanaPath('src/dev'));

export const log = createToolingLog('debug');
log.pipe(process.stdout);
