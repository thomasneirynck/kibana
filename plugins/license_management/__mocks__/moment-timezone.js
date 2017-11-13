const moment = require('moment-timezone');
moment.tz.guess = () => {
  return 'America/New_York';
};
module.exports = moment;
