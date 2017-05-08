import {
  withTmpDir,
  withProcRunner,
  getFtrConfig,
  runKibanaServer,
  runXpackKibanaGulpPrepare,
  runEsWithXpack,
  runFtr,
  log,
  RELATIVE_KBN_FTR_SCRIPT,
  isCliError,
} from './lib';

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


export function runFunctionalTestsServer() {
  withTmpDir(async tmpDir => {
    await withProcRunner(async procs => {
      const ftrConfig = await getFtrConfig();
      await runEsWithXpack({ tmpDir, procs, ftrConfig });
      await runXpackKibanaGulpPrepare({ procs });
      await runKibanaServer({ devMode: true, procs, ftrConfig });

      log.info(`

        Elasticsearch and Kibana ready for functional tests. Run the following in another terminal session to run the tests:

          node ${RELATIVE_KBN_FTR_SCRIPT}

      `);
      await procs.waitForAllToStop();
    });
  })
  .catch(fatalErrorHandler);
}
