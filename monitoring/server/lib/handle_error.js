import Boom from 'boom';

/**
 * TODO this behavior should be centralized and shared with all plugins
 */
export default function handleError(err, req) {
  const config = req.server.config();
  const loggingTag = config.get('monitoring.loggingTag');
  req.log([loggingTag, 'error'], err);
  if (err.isBoom) return err;
  const msg = err.msg || err.message;
  if (err.statusCode === 403) return Boom.forbidden(msg);
  if (msg === 'Not Found') return Boom.notFound();
  return Boom.badRequest(msg);
}
