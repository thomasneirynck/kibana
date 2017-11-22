import { createToolingLog } from '@elastic/plugin-helpers';

export const log = createToolingLog('debug');
log.pipe(process.stdout);
