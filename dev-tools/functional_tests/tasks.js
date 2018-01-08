import { relative } from 'path';
import Rx from 'rxjs/Rx';

import {
  withTmpDir,
  withProcRunner,
  getFtrConfig,
  runKibanaServer,
  runXpackKibanaGulpPrepare,
  runEsWithXpack,
  runFtr,
  log,
  KIBANA_FTR_SCRIPT,
  isCliError,
} from './lib';

const SUCCESS_MESSAGE = `

Elasticsearch and Kibana are ready for functional testing. Start the functional tests
in another terminal session by running this command from this directory:

    node ${relative(process.cwd(), KIBANA_FTR_SCRIPT)}

`;

export function fatalErrorHandler(err) {
  log.error('FATAL ERROR');
  log.error(isCliError(err) ? err.message : err);
  process.exit(1);
}

export function runFunctionTests() {
  withTmpDir(async tmpDir => {
    await withProcRunner(async procs => {
      const ftrConfig = await getFtrConfig();

      await runEsWithXpack({ tmpDir, procs, ftrConfig });
      await runXpackKibanaGulpPrepare({ procs });
      await runKibanaServer({ procs, ftrConfig });
      await runFtr({ procs });

      await procs.stop('kibana');
      await procs.stop('es');
    });
  })
    .catch(fatalErrorHandler);
}

export function runApiTests() {
  withTmpDir(async tmpDir => {
    await withProcRunner(async procs => {
      const ftrConfig = await getFtrConfig();

      await runEsWithXpack({ tmpDir, procs, ftrConfig });
      await runXpackKibanaGulpPrepare({ procs });
      await runKibanaServer({ procs, ftrConfig, enableUI: false });
      await runFtr({ procs, configPath: require.resolve('../../test/api_integration/config.js') });

      await procs.stop('kibana');
      await procs.stop('es');
    });
  })
    .catch(fatalErrorHandler);
}

export function runFunctionalTestsServer() {
  withTmpDir(async tmpDir => {
    await withProcRunner(async procs => {
      const ftrConfig = await getFtrConfig();
      await runEsWithXpack({ tmpDir, procs, ftrConfig });
      await runXpackKibanaGulpPrepare({ procs });
      await runKibanaServer({ devMode: true, procs, ftrConfig });

      // wait for 5 seconds of silence before logging the success message
      // so that it doesn't get burried
      await Rx.Observable.fromEvent(log, 'data')
        .switchMap(() => Rx.Observable.timer(5000))
        .first()
        .toPromise();

      log.info(SUCCESS_MESSAGE);
      await procs.waitForAllToStop();
    });
  })
    .catch(fatalErrorHandler);
}
