/**
 *
 * @param user
 * @param uiSettings
 * @returns {Promise<boolean>} Promise that resolves to true if the user is in dashboard mode, false otherwise.
 * A user is determined to be in dashboard only mode if *all* the roles they belong to are in Dashboard Only Mode.
 */
export async function getIsUserInDashboardMode(user, uiSettings) {
  const dashboardOnlyModeRoles = await uiSettings.get('dashboardOnlyModeRoles');
  if (!dashboardOnlyModeRoles || user.roles.length === 0) {
    return false;
  }
  const isDashboardOnlyModeRole = role => dashboardOnlyModeRoles.includes(role);
  return user.roles.every(isDashboardOnlyModeRole);
}
