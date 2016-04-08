module.exports = function (client) {
  return {
    getLicense: function () {
      return client.transport.request({
        method: 'GET',
        path: '_license'
      });
    },

    validate: function (body) {
      if (!body.license) throw new Error('Invalid response body');

      const validLicenses = ['trial', 'platinum', 'gold', 'standard'];
      const { status, type } = body.license;

      if (status !== 'active') throw new Error('Inactive license');
      if (validLicenses.indexOf(type.toLowerCase()) === -1) throw new Error('Invalid license type');
    },

    check: function () {
      return this.getLicense()
      .then(this.validate)
      .then(() => {
        return {
          enabled: true,
          message: `Valid license found`
        };
      })
      .catch((err) => {
        let msg = 'License check failed: ';
        if (err.statusCode) {
          msg += err.statusCode === 403 ? 'Not authorized' : `StatusCode ${err.statusCode}`;
        } else {
          msg += err.message;
        }

        return {
          enabled: false,
          message: msg
        };
      });
    }
  };
};