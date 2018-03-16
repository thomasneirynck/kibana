import { RequestTrialExtension } from '../public/sections/license_dashboard/request_trial_extension';
import { createMockLicense, getComponent } from './util';

describe('RequestTrialExtension component', () => {
  test('should not display when trial expires in > 24 days', () => {
    const nonImminentExpirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);
    const rendered = getComponent(
      {
        license: createMockLicense('trial', nonImminentExpirationTime)
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toMatchSnapshot();
  });
  test('should display when trial license is expired', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('trial', 0)
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toMatchSnapshot();
  });
  test('should display when trial license is about to expire', () => {
    // ten days from now
    const imminentExpirationTime = new Date().getTime() + (10 * 24 * 60 * 60 * 1000);
    const rendered = getComponent(
      {
        license: createMockLicense('trial', imminentExpirationTime)
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toMatchSnapshot();
  });
  test('should not display for active basic license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('basic')
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toBeNull();
  });
  test('should not display for active gold license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('gold')
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toBeNull();
  });
  test('should not display for active platinum license', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum')
      },
      RequestTrialExtension
    );
    expect(rendered.html()).toBeNull();
  });
});
