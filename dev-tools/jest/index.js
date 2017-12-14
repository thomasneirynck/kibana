import jest from 'jest';
import { resolve } from 'path';
import { resolveKibanaPath } from '@elastic/plugin-helpers';

import { createJestConfig } from './create_jest_config';


export function runJest() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
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
