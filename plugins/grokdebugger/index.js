import { resolve } from 'path';
import { PLUGIN } from './common/constants';
import { registerGrokdebuggerRoutes } from './server/routes/api/grokdebugger';
import { registerLicenseChecker } from './server/lib/register_license_checker';

export const grokdebugger = (kibana) => new kibana.Plugin({
  id: PLUGIN.ID,
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'elasticsearch', 'xpack_main'],
  configPrefix: 'xpack.grokdebugger',
  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true)
    }).default();
  },
  uiExports: {
    devTools: ['plugins/grokdebugger/sections/grokdebugger'],
    hacks: ['plugins/grokdebugger/sections/grokdebugger/register'],
    home: ['plugins/grokdebugger/register_feature'],
  },
  init: (server) => {
    registerLicenseChecker(server);
    registerGrokdebuggerRoutes(server);
  }
});
