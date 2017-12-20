
export const cloud = (kibana) => {
  return new kibana.Plugin({
    id: 'cloud',
    configPrefix: 'xpack.cloud',
    require: ['kibana', 'elasticsearch', 'xpack_main'],

    uiExports: {
      injectDefaultVars: function (server, options) {
        return {
          isCloudEnabled: options.enabled,
          cloudId: options.id,
        };
      }
    },

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(false),
        id: Joi.string().when('enabled', {
          is: true,
          then: Joi.required(),
        }),
      }).default();
    },
  });
};
