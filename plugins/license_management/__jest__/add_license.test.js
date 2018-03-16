import { AddLicense } from '../public/sections/license_dashboard/add_license';
import { createMockLicense, getComponent } from './util';

describe('AddLicense component when license is active', () => {
  test('should display correct verbiage', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('basic')
      },
      AddLicense
    );
    expect(rendered.html()).toMatchSnapshot();
  });
});

describe('AddLicense component when license is expired', () => {
  test('should display with correct verbiage', () => {
    const rendered = getComponent(
      {
        license: createMockLicense('platinum', 0)
      },
      AddLicense
    );
    expect(rendered.html()).toMatchSnapshot();
  });
});
