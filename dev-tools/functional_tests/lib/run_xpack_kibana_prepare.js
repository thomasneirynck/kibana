import {
  XPACK_KIBANA_ROOT,
  GULP_COMMAND_PATH
} from './paths';

export async function runXpackKibanaGulpPrepare({ procs }) {
  await procs.run('xpack prepare', {
    cmd: GULP_COMMAND_PATH,
    args: ['prepare'],
    cwd: XPACK_KIBANA_ROOT,
    wait: true,
  });
}
