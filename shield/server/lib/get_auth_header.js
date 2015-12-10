module.exports = function getAuthHeader(username, password) {
  const auth = new Buffer(`${username}:${password}`, 'utf8').toString('base64');
  return {'Authorization': `Basic ${auth}`};
};