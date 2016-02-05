import getIsValidUser from './get_is_valid_user';

export default (server) => {
  const isValidUser = getIsValidUser(server);

  return function validate(request, session, callback) {
    return isValidUser(request, session.username, session.password).then(
      () => callback(null, true),
      (error) => callback(error, false)
    );
  };
};
