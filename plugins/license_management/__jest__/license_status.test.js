import { LicenseStatus } from '../public/sections/license_dashboard/license_status';
import { createMockLicense, getComponent } from './util';

describe('LicenseStatus component', () => {
  test('should display normally when license is active', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('gold')
      },
      LicenseStatus
    );
    expect(rendered.html()).toMatchSnapshot();
  });
  test('should display display warning is expired', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum', 0)
      },
      LicenseStatus
    );
    expect(rendered.html()).toMatchSnapshot();
  });
});
