// Stolen from Angular, used to get reliable encoded URIs
const _ = require('lodash');

function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val)
  .replace(/%40/gi, '@')
  .replace(/%3A/gi, ':')
  .replace(/%24/g, '$')
  .replace(/%2C/gi, ',')
  .replace(/%3B/gi, ';')
  .replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
};

function toKeyValue(obj) {
  var parts = [];
  _.forEach(obj, function (value, key) {
    if (_.isArray(value)) {
      _.forEach(value, function (arrayValue) {
        const keyStr = encodeUriQuery(key, true);
        const valStr = (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true));
        parts.push(keyStr + valStr);
      });
    } else {
      const keyStr = encodeUriQuery(key, true);
      const valStr = (value === true ? '' : '=' + encodeUriQuery(value, true));
      parts.push(keyStr + valStr);
    }
  });
  return parts.length ? parts.join('&') : '';
};

module.exports = {
  stringify: toKeyValue,
  encodeQuery: encodeUriQuery,
};