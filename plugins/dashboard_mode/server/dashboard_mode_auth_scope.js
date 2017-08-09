import {
  CONFIG_DASHBOARD_ONLY_MODE_ROLES,
  AUTH_SCOPE_DASHBORD_ONLY_MODE,
} from '../common';

/**
 *  Registered with the security plugin to extend the auth scopes to
 *  include "xpack:dashboardMode" when the request should be in
 *  dashboard only mode.
 *
 *  @type {XpackSecurity.ScopeExtender}
 *  @param {Hapi.Request} request
 *  @param {Object} user user object from the security api
 *  @return {Promise<Array<string>|void>}
 */
export async function getDashboardModeAuthScope(request, user) {
  const uiSettings = request.getUiSettingsService();
  const dashboardOnlyModeRoles = await uiSettings.get(CONFIG_DASHBOARD_ONLY_MODE_ROLES);
  if (!dashboardOnlyModeRoles || user.roles.length === 0) {
    return;
  }

  const isDashboardOnlyModeRole = role => dashboardOnlyModeRoles.includes(role);
  if (user.roles.every(isDashboardOnlyModeRole)) {
    return [AUTH_SCOPE_DASHBORD_ONLY_MODE];
  }
}
