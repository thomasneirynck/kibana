import TestRenderer from 'react-test-renderer';
import React from 'react';
import Wrapper from '../public/app';
import { Provider } from 'react-redux';
import { licenseManagementStore } from "../public/store/store";
import { MemoryRouter } from 'react-router-dom';
import { BASE_PATH } from '../common/constants';

import sinon from 'sinon';

const highExpirationMillis = new Date("October 13, 2099 00:00:00Z");
const license = (type, expiryDateInMillis = highExpirationMillis) => {
  return  {
    type,
    expiryDateInMillis,
    isActive: true
  };
};
const getComponent = (initialState) => {
  const store = licenseManagementStore(initialState);
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[ `${BASE_PATH}`]}>
        <Wrapper />
      </MemoryRouter>
    </Provider>
  );
};

describe('LicenseDashboard', () => {
  it('should display all panels for a trial license', () => {
    const rendered = TestRenderer.create(getComponent({ license: license('trial') }));
    expect(rendered).toMatchSnapshot();
  });
});
it('should display just license status for gold license', () => {
  const rendered = TestRenderer.create(getComponent({ license: license('gold') }));
  expect(rendered).toMatchSnapshot();
});
it('should display just license status and subscription for basic license', () => {
  const rendered = TestRenderer.create(getComponent({ license: license('basic') }));
  expect(rendered).toMatchSnapshot();
});
it('should display expiration notice for expired license', () => {
  const rendered = TestRenderer.create(getComponent({ license: license('gold', 0) }));
  expect(rendered).toMatchSnapshot();
});
it('should display basic registration pitch for license expiring in 25 days', () => {
  const clock = sinon.useFakeTimers(1506869972000);
  const rendered = TestRenderer.create(getComponent({ license: license('gold', 1508937678000) }));
  expect(rendered).toMatchSnapshot();
  clock.uninstall();
});

