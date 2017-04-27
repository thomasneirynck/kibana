
import {
  KIBANA_FTR_SCRIPT,
  PROJECT_ROOT
} from './paths';

export async function runFtr({ procs }) {
  await procs.run('ftr', {
    cmd: 'node',
    args: [KIBANA_FTR_SCRIPT],
    cwd: PROJECT_ROOT,
    wait: true
  });
}
