const os = require('os');
const defaultCPUCount = 2;

function cpuCount() {
  try {
    return os.cpus().length;
  } catch (e) {
    return defaultCPUCount;
  }
};

module.exports = function (Joi) {
  return Joi.object({
    enabled: Joi.boolean().default(true),
    kibanaApp: Joi.string().regex(/^\//).default('/app/kibana'),
    kibanaServer: Joi.object({
      protocol: Joi.string().valid(['http', 'https']),
      hostname: Joi.string(),
      port: Joi.number().integer()
    }).default(),
    phantom: Joi.object({
      zoom: Joi.number().integer().default(1),
      viewport: Joi.object({
        width: Joi.number().integer().default(1320),
        height: Joi.number().integer().default(640)
      }).default(),
      timeout: Joi.number().integer().default(6000),
      loadDelay: Joi.number().integer().default(3000)
    }).default(),
    capture: Joi.object({
      // TODO: use cpu core count by default
      concurrency: Joi.number().integer().default(cpuCount()),
    }).default(),
  }).default();
};