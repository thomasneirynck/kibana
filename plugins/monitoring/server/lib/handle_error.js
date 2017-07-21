import Boom from 'boom';
import { LOGGING_TAG } from '../../common/constants';

export function handleError(err, req) {
  const statusCode = err.isBoom ? err.output.statusCode : err.statusCode;

  req.log(['error', LOGGING_TAG], err);

  // rewrite auth exceptions
  if (statusCode === 401 || statusCode === 403) {
    let message;
    /* 401 is changed to 403 because in user perception, they HAVE provided
     * crendentials for the API.
     * They should see the same message whether they're logged in but
     * insufficient permissions, or they're login is valid for the production
     * connection but not the monitoring connection
     */
    if (statusCode === 401) {
      message = 'Invalid authentication for monitoring cluster';
    } else {
      message = 'Insufficient user permissions for monitoring data';
    }

    return Boom.forbidden(message);
  }

  // we only needed to rewrite auth exceptions
  if (err.isBoom) {
    return err;
  }

  // boom expects err.message, not err.msg
  if (err.msg) {
    err.message = err.msg;

    delete err.msg;
  }

  // wrap the error; defaults to statusCode = 500 if statusCode is undefined
  return Boom.wrap(err, statusCode);
}
