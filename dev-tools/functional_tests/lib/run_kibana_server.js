import { format as formatUrl } from 'url';

import {
  PROJECT_ROOT,
  KIBANA_ROOT,
  KIBANA_EXEC,
  KIBANA_EXEC_PATH,
  OPTIMIZE_BUNDLE_DIR
} from './paths';

export async function runKibanaServer({ procs, ftrConfig, devMode = false }) {
  // start the kibana server and wait for it to log "Server running" before resolving
  await procs.run('kibana', {
    cmd: KIBANA_EXEC,
    args: [
      KIBANA_EXEC_PATH,
      devMode ? '--dev' : '--env=development',
      `--plugin-path=${PROJECT_ROOT}`,
      '--logging.json=false',
      '--no-base-path',
      `--server.port=${ftrConfig.get('servers.kibana.port')}`,
      `--server.uuid=${ftrConfig.get('env').kibana.server.uuid}`,
      `--elasticsearch.url=${formatUrl(ftrConfig.get('servers.elasticsearch'))}`,
      `--optimize.lazyPort=${ftrConfig.get('servers.kibana.port') + 1}`,
      '--optimize.lazyPrebuild=true',
      '--status.allowAnonymous=true',
      `--optimize.bundleDir=${OPTIMIZE_BUNDLE_DIR}`,
      `--elasticsearch.username=${ftrConfig.get('servers.elasticsearch.username')}`,
      `--elasticsearch.password=${ftrConfig.get('servers.elasticsearch.password')}`,
      '--xpack.monitoring.kibana.collection.enabled=false',
    ],
    cwd: KIBANA_ROOT,
    wait: /Server running/,
  });
}
