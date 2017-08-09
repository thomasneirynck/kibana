import { getIsValidUser } from './get_is_valid_user';
import { getCalculateExpires } from './get_calculate_expires';

export function getCookieValidate(server, authScope) {
  const isValidUser = getIsValidUser(server);
  const calculateExpires = getCalculateExpires(server);
  const { isSystemApiRequest } = server.plugins.kibana.systemApi;

  return async function validate(request, session, callback) {
    try {
      if (hasSessionExpired(session)) {
        throw new Error('Session has expired');
      }

      const { username, password } = session;
      const user = await isValidUser(request, username, password);

      // Extend the session timeout provided this is NOT a system API call
      if (!isSystemApiRequest(request)) {
        // Keep the session alive
        request.cookieAuth.set({
          username,
          password,
          expires: calculateExpires()
        });
      }

      callback(null, true, {
        username,
        scope: await authScope.getForRequestAndUser(request, user)
      });
    } catch (error) {
      callback(error, false);
    }
  };
};

export function hasSessionExpired(session) {
  const { expires } = session;
  return !!(expires && expires < Date.now());
}
