import getIsValidUser from './get_is_valid_user';
import getCalculateExpires from './get_calculate_expires';

export default (server) => {
  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);

  return function validate(request, session, callback) {
    const {username, password, expires} = session;
    if (expires < Date.now()) return callback(new Error('Session has expired'), false);

    return isValidUser(request, username, password).then(
      () => {
        // If this is a system API call, do NOT extend the session timeout
        // NOTE: The header name is hardcoded here because the code to generate it lives in client-side code (in core
        // Kibana), whereas this code here is server-side and we don't have any code sharing going on at the moment.
        if (!!request.headers['kbn-system-api']) {
          return callback(null, true);
        }

        // Keep the session alive
        request.auth.session.set({
          username,
          password,
          expires: calculateExpires()
        });
        return callback(null, true);
      },
      (error) => callback(error, false)
    );
  };
};
