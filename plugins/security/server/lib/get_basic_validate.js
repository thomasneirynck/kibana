import { getIsValidUser } from './get_is_valid_user';

export function getBasicValidate(server, authScope) {
  const isValidUser = getIsValidUser(server);

  return async function validate(request, username, password, callback) {
    try {
      const user = await isValidUser(request, username, password);
      callback(null, true, {
        username,
        password,
        scope: await authScope.getForRequestAndUser(request, user)
      });
    } catch (error) {
      callback(error, false);
    }
  };
}
