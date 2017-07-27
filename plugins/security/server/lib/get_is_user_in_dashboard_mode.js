import { CONFIG_DASHBOARD_ONLY_MODE_ROLES } from '../../common/constants';

/**
 *
 * @param user
 * @param uiSettings
 * @returns {Promise<boolean>} Promise that resolves to true if the user is in dashboard mode, false otherwise.
 * A user is determined to be in dashboard only mode if *all* the roles they belong to are in Dashboard Only Mode.
 */
export async function getIsUserInDashboardMode(user, uiSettings) {
  const dashboardOnlyModeRoles = await uiSettings.get(CONFIG_DASHBOARD_ONLY_MODE_ROLES);
  if (!dashboardOnlyModeRoles || user.roles.length === 0) {
    return false;
  }
  const isDashboardOnlyModeRole = role => dashboardOnlyModeRoles.includes(role);
  return user.roles.every(isDashboardOnlyModeRole);
}
