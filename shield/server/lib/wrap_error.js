const Boom = require('boom');

module.exports = (error) => Boom.wrap(error, error.status, error.message);