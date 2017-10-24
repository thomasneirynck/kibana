import path from 'path';
import { Command } from 'commander';

import { build } from './build';

const cmd = new Command('node scripts/build_chromium');
cmd.option('--workspace [path]', 'working directory for building chromium', path.join(__dirname, '.workspace'))
  .option('--git-sha [sha]', 'chromium src git SHA to checkout', '503a3e48dffe2d5bcbacef72d33b6e1801d061a2')
  .parse(process.argv);

(async function () {
  try {
    await build(cmd);
  }
  catch (err) {
    console.error(err.stack);
    process.exit(1);
  }
}());
