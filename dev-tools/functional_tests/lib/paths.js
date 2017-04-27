import { resolve, relative } from 'path';
import { platform as getPlatform } from 'os';

import { resolveKibanaPath } from '@elastic/plugin-helpers';

// resolve() treat relative paths as relative to process.cwd(), so to
// return a relative path we use relative()
function resolveRelative(path) {
  return relative(process.cwd(), resolve(path));
}

function useBat(bin) {
  return getPlatform().startsWith('win') ? `${bin}.bat` : bin;
}

export const KIBANA_EXEC = useBat(resolveKibanaPath('bin/kibana'));
export const KIBANA_ROOT = resolveKibanaPath('');
export const KIBANA_FTR_SCRIPT = resolve(KIBANA_ROOT, 'scripts/functional_test_runner');
export const RELATIVE_KIBANA_FTR_SCRIPT = relative(process.cwd(), KIBANA_FTR_SCRIPT);
export const PROJECT_ROOT = resolve(__dirname, '../../../');
export const FTR_CONFIG_PATH = resolve(PROJECT_ROOT, 'test/functional/config');
export const OPTIMIZE_BUNDLE_DIR = resolve(KIBANA_ROOT, 'optimize/xpackTestUiServer');
export const ES_REPO_ROOT = resolve(PROJECT_ROOT, '../elasticsearch');
export const XPACK_ES_REPO_ROOT = resolve(ES_REPO_ROOT, '../elasticsearch-extra/x-pack-elasticsearch');
export const ES_ARCHIVE_PATTERN = resolve(ES_REPO_ROOT, 'distribution/tar/build/distributions/elasticsearch-*.tar.gz');
export const XPACK_ES_ARCHIVE_PATTERN = resolve(XPACK_ES_REPO_ROOT, 'plugin/build/distributions/x-pack-*.zip');

export const RELATIVE_GRADLE_BIN = resolveRelative(useBat('gradle'));
export const RELATIVE_ES_BIN = resolveRelative(useBat('bin/elasticsearch'));
export const RELATIVE_ES_PLUGIN_BIN = resolveRelative(useBat('bin/elasticsearch-plugin'));
