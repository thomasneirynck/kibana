import { resolve } from 'path';
import { registerLogstashPipelinesRoutes } from './server/routes/api/pipelines';
import { registerLogstashPipelineRoutes } from './server/routes/api/pipeline';

export const logstash = (kibana) => new kibana.Plugin({
  id: 'logstash',
  publicDir: resolve(__dirname, 'public'),
  require: ['kibana', 'security', 'elasticsearch', 'xpack_main'],
  configPrefix: 'xpack.logstash',
  config(Joi) {
    return Joi.object({
      enabled: Joi.boolean().default(true)
    }).default();
  },
  uiExports: {
    managementSections: [
      'plugins/logstash/sections/pipeline_list',
      'plugins/logstash/sections/pipeline_edit'
    ]
  },
  init: (server) => {
    registerLogstashPipelinesRoutes(server);
    registerLogstashPipelineRoutes(server);
  }
});
