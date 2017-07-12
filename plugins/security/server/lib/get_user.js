import { getClient } from '../../../../server/lib/get_client_shield';
import { getIsUserInDashboardMode } from './get_is_user_in_dashboard_mode';

export function getUserProvider(server) {
  const callWithRequest = getClient(server).callWithRequest;

  server.expose('getUser', async (request) => {
    const xpackInfo = server.plugins.xpack_main.info;
    if (xpackInfo && xpackInfo.isAvailable() && !xpackInfo.feature('security').isEnabled()) {
      return Promise.resolve(null);
    }
    const user = await callWithRequest(request, 'shield.authenticate');
    user.isDashboardOnlyMode = await getIsUserInDashboardMode(user, request.getUiSettingsService());
    return user;
  });
}
