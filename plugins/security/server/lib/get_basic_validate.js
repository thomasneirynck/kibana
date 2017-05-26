import { getIsValidUser } from './get_is_valid_user';

export function getBasicValidate(server) {
  const isValidUser = getIsValidUser(server);

  return function validate(request, username, password, callback) {
    return isValidUser(request, username, password).then(
      (user) => callback(null, true, { username, password, isDashboardOnlyMode: user.isDashboardOnlyMode }),
      (error) => callback(error, false)
    );
  };
}
