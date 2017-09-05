import { resolve } from 'path';
import { platform as getPlatform } from 'os';

import { log } from './log';
import { extractTarball } from './tarball';
import { findMostRecentlyChanged } from './find_most_recently_changed';
import { setupUsers, DEFAULT_SUPERUSER_PASS } from './auth';
import {
  RELATIVE_ES_BIN,
  RELATIVE_ES_PLUGIN_BIN,
  RELATIVE_ES_KEYSTORE_BIN,
  RELATIVE_GRADLE_BIN,
  XPACK_ES_REPO_ROOT,
  ES_ARCHIVE_PATTERN,
  XPACK_ES_ARCHIVE_PATTERN
} from './paths';

export async function runEsWithXpack({ tmpDir, procs, ftrConfig }) {
  const esExtractPath = resolve(tmpDir, 'es');

  await procs.run('buildEsAndXpack', {
    cmd: RELATIVE_GRADLE_BIN,
    args: [':distribution:tar:assemble', ':x-pack-elasticsearch:plugin:assemble'],
    cwd: XPACK_ES_REPO_ROOT,
    wait: true,
  });

  const esTarballPath = findMostRecentlyChanged(ES_ARCHIVE_PATTERN);
  const xpackZipPath = findMostRecentlyChanged(XPACK_ES_ARCHIVE_PATTERN);
  log.debug('es build output %j', esTarballPath);
  log.debug('es x-pack build output %j', esTarballPath);

  const xpackZipFileUrl = getPlatform().startsWith('win')
    ? `file:///${xpackZipPath.replace(/\\/g, '/')}`
    : `file://${xpackZipPath}`;

  await extractTarball(esTarballPath, esExtractPath);

  await procs.run('xpackInstall', {
    cmd: RELATIVE_ES_PLUGIN_BIN,
    args: [ 'install', '--silent', xpackZipFileUrl ],
    cwd: esExtractPath,
    wait: true
  });

  await procs.run('createEsKeystore', {
    cmd: RELATIVE_ES_KEYSTORE_BIN,
    args: [ 'create' ],
    cwd: esExtractPath,
    wait: true,
  });

  await procs.run('setDefaultSuperuserPassword', {
    cmd: RELATIVE_ES_KEYSTORE_BIN,
    stdin: DEFAULT_SUPERUSER_PASS,
    args: [ 'add', 'bootstrap.password', '-x' ],
    cwd: esExtractPath,
    wait: true,
  });

  await procs.run('es', {
    cmd: RELATIVE_ES_BIN,
    args: [
      '-E', `http.port=${ftrConfig.get('servers.elasticsearch.port')}`,
      '-E', `xpack.monitoring.enabled=false` // disable monitoring in order to drive the UI just with archived data
    ],
    cwd: esExtractPath,
    wait: /^\[.+?\]\[.+?\]\[.+?\] \[.+?\] started$/
  });

  await setupUsers(log, ftrConfig);
}
