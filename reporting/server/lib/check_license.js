module.exports = function (client) {
  return {
    getLicense: function () {
      return client.transport.request({
        method: 'GET',
        path: '_license'
      });
    },

    validateType: function (body, type) {
      const types = ['basic', 'standard', 'gold', 'platinum', 'trial'];
      let licenseType = body.license.type.toLowerCase();
      if (licenseType === 'subscription') licenseType = 'gold';

      const active = body.license.status === 'active';
      const checkIndex = types.indexOf(type);
      const validType = checkIndex !== -1 && types.indexOf(licenseType) >= checkIndex;

      if (!active) {
        throw new Error('License is not active');
      } else if (!validType) {
        throw new Error('Incorrect license type found');
      }

      return true;
    },

    check: function () {
      var requiredType = 'gold';

      return this.getLicense()
      .then((res) => this.validateType(res, requiredType))
      .then((valid) => {
        if (!valid) throw Error('Invalid license');

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