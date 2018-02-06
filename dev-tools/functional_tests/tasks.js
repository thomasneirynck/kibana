import { relative } from 'path';
import Rx from 'rxjs/Rx';
import { Command } from 'commander';

import {
  withTmpDir,
  withProcRunner,
  getFtrConfig,
  runKibanaServer,
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
      await runKibanaServer({ procs, ftrConfig });
      await runFtr({ procs });

      await procs.stop('kibana');
      await procs.stop('es');
    });
  })
    .catch(fatalErrorHandler);
}

export async function runApiTests() {
  try {
    await withTmpDir(async tmpDir => {
      await withProcRunner(async procs => {
        const ftrConfig = await getFtrConfig();

        await runEsWithXpack({ tmpDir, procs, ftrConfig });
        await runKibanaServer({ procs, ftrConfig, enableUI: false });
        await runFtr({ procs, configPath: require.resolve('../../test/api_integration/config.js') });

        await procs.stop('kibana');
        await procs.stop('es');

        // Run SAML specific API integration tests.
        await runEsWithXpack({ tmpDir, procs, ftrConfig, useSAML: true });
        await runKibanaServer({ procs, ftrConfig, enableUI: false, useSAML: true });
        await runFtr({ procs, configPath: require.resolve('../../test/saml_api_integration/config.js') });

        await procs.stop('kibana');
        await procs.stop('es');
      });
    });
  } catch(err) {
    fatalErrorHandler(err);
  }
}

export async function runFunctionalTestsServer() {
  const cmd = new Command('node scripts/functional_test_server');

  cmd
    .option('--saml', 'Run Elasticsearch and Kibana with configured SAML security realm', false)
    .parse(process.argv);

  const useSAML = cmd.saml;

  try {
    await withTmpDir(async tmpDir => {
      await withProcRunner(async procs => {
        const ftrConfig = await getFtrConfig();
        await runEsWithXpack({ tmpDir, procs, ftrConfig, useSAML });
        await runKibanaServer({ devMode: true, procs, ftrConfig, useSAML });

        // wait for 5 seconds of silence before logging the success message
        // so that it doesn't get burried
        await Rx.Observable.fromEvent(log, 'data')
          .switchMap(() => Rx.Observable.timer(5000))
          .first()
          .toPromise();

        log.info(SUCCESS_MESSAGE);
        await procs.waitForAllToStop();
      });
    });
  } catch(err) {
    fatalErrorHandler(err);
  }
}
