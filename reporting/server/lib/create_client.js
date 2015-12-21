module.exports = function (elasticsearch, config) {
  var username = config.get('reporting.auth.username');
  var password = config.get('reporting.auth.password');
  let opts = { auth: false };

  if (username || password) {
    opts = { username, password };
  }

  return elasticsearch.createClient(opts);
};