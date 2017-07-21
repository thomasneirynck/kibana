import { resolve } from 'path';
import { uiExports } from './ui_exports.js';
import { init } from './init.js';
import { PLUGIN } from './common/constants';

export const upgrade = (kibana) => new kibana.Plugin({
  require: ['kibana', 'elasticsearch', 'xpack_main'],
  id: PLUGIN.ID,
  configPrefix: 'xpack.upgrade',
  publicDir: resolve(__dirname, 'public'),
  init,
  uiExports,
});
