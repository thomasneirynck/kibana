module.exports = function (elasticsearch, config) {
  var username = config.get('reporting.auth.username');
  var password = config.get('reporting.auth.password');
  const auth = { username, password };
  return elasticsearch.createClient(auth);
};