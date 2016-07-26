import getIsValidUser from './get_is_valid_user';
import getCalculateExpires from './get_calculate_expires';

export default (server) => {
  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);

  return function validate(request, session, callback) {
    console.log('cookie validate');
    const {username, password, expires} = session;
    if (expires < Date.now()) return callback(new Error('Session has expired'), false);

    return isValidUser(request, username, password).then(
      () => {
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
