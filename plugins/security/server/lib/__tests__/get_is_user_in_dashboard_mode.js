import expect from 'expect.js';
import { getIsUserInDashboardMode } from '../get_is_user_in_dashboard_mode';

describe('getIsUserInDashboardMode', function () {
  function getUiSettingsMock() {
    return {
      get: (mode) => {
        expect(mode).to.equal('dashboardOnlyModeRoles');
        return Promise.resolve([
          'dash-only-mode',
          'another-limited-mode',
        ]);
      }
    };
  }

  describe('returns true', () => {
    it('when all roles are in dashboard mode', function () {
      const userMock = {
        roles: ['dash-only-mode', 'another-limited-mode']
      };
      return getIsUserInDashboardMode(userMock, getUiSettingsMock()).then((result) => {
        expect(result).to.be(true);
      });
    });
  });

  describe('returns false', () => {
    it('when no roles are in dashboard mode', function () {
      const userMock = {
        roles: ['super-mode', 'a-super-role']
      };
      return getIsUserInDashboardMode(userMock, getUiSettingsMock()).then((result) => {
        expect(result).to.be(false);
      });
    });

    it('when one role is not in dashboard mode', function () {
      const userMock = {
        roles: ['dash-only-mode', 'another-limited-mode', 'a-super-role']
      };
      return getIsUserInDashboardMode(userMock, getUiSettingsMock()).then((result) => {
        expect(result).to.be(false);
      });
    });

    it('when the user has no roles', function () {
      const userMock = { roles: [] };
      return getIsUserInDashboardMode(userMock, getUiSettingsMock()).then((result) => {
        expect(result).to.be(false);
      });
    });

    // eslint-disable-next-line jest/no-identical-title
    it('when no roles are in dashboard mode', function () {
      const uiSettingsMock = { get: () => [] };
      const userMock = { roles: ['a-role'] };
      return getIsUserInDashboardMode(userMock, uiSettingsMock).then((result) => {
        expect(result).to.be(false);
      });
    });

    it('when no roles are in dashboard mode and user has no roles', function () {
      const uiSettingsMock = { get: () => [] };
      const userMock = { roles: [] };
      return getIsUserInDashboardMode(userMock, uiSettingsMock).then((result) => {
        expect(result).to.be(false);
      });
    });
  });
});
