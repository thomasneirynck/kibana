/**
 *
 * @param user
 * @param request
 * @param uiSettings
 * @returns {Promise<boolean>} Promise that resolves to true if the user is in dashboard mode, false otherwise.
 * A user is determined to be in dashboard only mode if *all* the roles they belong to are in Dashboard Only Mode.
 */
export async function getIsUserInDashboardMode(user, request, uiSettings) {
  const dashboardOnlyModeRoles = await uiSettings.get(request, 'dashboardOnlyModeRoles');
  if (!dashboardOnlyModeRoles || user.roles.length === 0) {
    return false;
  }
  const isDashboardOnlyModeRole = role => dashboardOnlyModeRoles.includes(role);
  return user.roles.every(isDashboardOnlyModeRole);
}
