import _ from 'lodash';
import Boom from 'boom';
import Joi from 'joi';
import getClient from '../../../lib/get_client_shield';
import userSchema from '../../../lib/user_schema';
import { wrapError } from '../../../lib/errors';
import getCalculateExpires from '../../../lib/get_calculate_expires';
import onChangePassword from '../../../lib/on_change_password';
import routePreCheckLicense from '../../../lib/route_pre_check_license';

export default (server) => {
  const callWithRequest = getClient(server).callWithRequest;
  const calculateExpires = getCalculateExpires(server);
  const routePreCheckLicenseFn = routePreCheckLicense(server);

  server.route({
    method: 'GET',
    path: '/api/security/v1/users',
    handler(request, reply) {
      return callWithRequest(request, 'shield.getUser').then(
        (response) => reply(_.values(response)),
        _.flow(wrapError, reply)
      );
    },
    config: {
      pre: [routePreCheckLicenseFn]
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.getUser', {username}).then(
        (response) => {
          if (response[username]) return reply(response[username]);
          return reply(Boom.notFound());
        },
        _.flow(wrapError, reply));
    },
    config: {
      pre: [routePreCheckLicenseFn]
    }
  });

  server.route({
    method: 'POST',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      const body = _(request.payload).omit(['username', 'enabled']).omit(_.isNull);
      return callWithRequest(request, 'shield.putUser', {username, body}).then(
        () => reply(request.payload),
        _.flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: userSchema
      },
      pre: [routePreCheckLicenseFn]
    }
  });

  server.route({
    method: 'DELETE',
    path: '/api/security/v1/users/{username}',
    handler(request, reply) {
      const username = request.params.username;
      return callWithRequest(request, 'shield.deleteUser', {username}).then(
        () => reply().code(204),
        _.flow(wrapError, reply));
    },
    config: {
      pre: [routePreCheckLicenseFn]
    }
  });

  server.route({
    method: 'POST',
    path: '/api/security/v1/users/{username}/password',
    handler(request, reply) {
      const username = request.params.username;
      const body = request.payload;
      return callWithRequest(request, 'shield.changePassword', {username, body}).then(
        onChangePassword(request, username, body.password, calculateExpires, reply),
        _.flow(wrapError, reply));
    },
    config: {
      validate: {
        payload: {
          password: Joi.string().required()
        }
      },
      pre: [routePreCheckLicenseFn]
    }
  });
};
