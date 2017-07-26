import jest from 'jest';
import { resolve } from 'path';
import { resolveKibanaPath } from '@elastic/plugin-helpers';

import { createJestConfig } from './create_jest_config';


export function runJest() {
  const config = JSON.stringify(createJestConfig({
    kibanaDirectory: resolveKibanaPath(''),
    xPackKibanaDirectory: resolve(__dirname, '..', '..'),
  }));

  const argv = [
    ...process.argv.slice(2),
    '--config', config,
  ];

  return jest.run(argv);
}
