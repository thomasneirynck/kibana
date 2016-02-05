import Boom from 'boom';

export default function wrapError(error) {
  return Boom.wrap(error, error.status, error.message);
};
