var config;

module.exports = {
  set: function (cfg) {
    config = cfg;
  },
  get: function (path) {
    return config.get.apply(config, arguments);
  }
};