import TestRenderer from 'react-test-renderer';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Wrapper from '../public/app';
import { Provider } from 'react-redux';
import { uploadLicense } from "../public/store/actions/upload_license";
import { licenseManagementStore } from "../public/store/store";
import { BASE_PATH } from '../common/constants';

import sinon from 'sinon';

let server = null;
let store = null;
let component = null;
const services = {
  kbnUrl: {
    change: jest.fn()
  },
  autoLogout: () => {},
  xPackInfo: {
    refresh: jest.fn(),
    get: () => { return { license: { type: 'basic' } }; }
  }
};

describe('UploadLicense', () => {
  beforeEach(() => {
    server = sinon.fakeServer.create();
    server.respondImmediately = true;
    store = licenseManagementStore();
    component = (
      <Provider store={store}>
        <MemoryRouter initialEntries={[ `${BASE_PATH}upload_license`]}>
          <Wrapper />
        </MemoryRouter>
      </Provider>
    );
  });
  afterEach(() => {
    server.restore();
    services.xPackInfo.refresh.mockReset();
    services.kbnUrl.change.mockReset();
  });
  it('should display an error when submitting invalid JSON', async () => {
    store.dispatch(uploadLicense('INVALID', 'trial'));
    const rendered = TestRenderer.create(component);
    expect(rendered).toMatchSnapshot();
  });
  it('should display an error when ES says license is invalid', async () => {
    const invalidLicense = JSON.stringify({ license: { type: 'basic' } });
    server.respond([200, { "Content-Type": "application/json" },
      '{"acknowledged": "true", "license_status": "invalid"}']);
    await uploadLicense(invalidLicense)(store.dispatch, null, services);
    const rendered = TestRenderer.create(component);
    expect(rendered).toMatchSnapshot();
  });
  it('should display an error when ES says license is expired', async () => {
    const invalidLicense = JSON.stringify({ license: { type: 'basic' } });
    server.respond([200, { "Content-Type": "application/json" },
      '{"acknowledged": "true", "license_status": "expired"}']);
    await uploadLicense(invalidLicense)(store.dispatch, null, services);
    const rendered = TestRenderer.create(component);
    expect(rendered).toMatchSnapshot();
  });
  it('should display a modal when license requires acknowledgement', async () => {
    const unacknowledgedLicense = JSON.stringify({ license: { type: 'basic' } });
    /* eslint-disable max-len */
    server.respond([200, { "Content-Type": "application/json" },
      `{
          "acknowledged":false,
          "license_status":"valid",
          "acknowledge":
            {
              "message": "This license update requires acknowledgement. To acknowledge the license, please read the following messages and update the license again, this time with the \\"acknowledge=true\\" parameter:",
              "watcher":["Watcher will be disabled"]
            }
          }`]);
    /* eslint-enable max-len */
    await uploadLicense(unacknowledgedLicense,  'trial')(store.dispatch, null, services);
    const rendered = TestRenderer.create(component);
    expect(rendered).toMatchSnapshot();
  });
  it('should refresh xpack info and navigate to BASE_PATH when ES accepts new license', async () => {
    const validLicense = JSON.stringify({ license: { type: 'basic' } });
    server.respond([200, { "Content-Type": "application/json" },
      '{"acknowledged": "true", "license_status": "valid"}']);
    await uploadLicense(validLicense)(store.dispatch, null, services);
    expect(services.xPackInfo.refresh).toHaveBeenCalled();
    expect(services.kbnUrl.change).toHaveBeenCalledWith(BASE_PATH);
  });
  it('should display error when ES returns error', async () => {
    const license = JSON.stringify({ license: { type: 'basic' } });
    /* eslint-disable max-len */
    server.respond([200, { "Content-Type": "application/json" },
      `{
        "error":
        {
          "root_cause":
            [{
              "type":"illegal_state_exception",
              "reason":"Can not upgrade to a production license unless TLS is configured or security is disabled"
            }],"type":"illegal_state_exception",
            "reason":"Can not upgrade to a production license unless TLS is configured or security is disabled"},
            "status":500}
      `]);
  /* eslint-enable max-len */
    await uploadLicense(license)(store.dispatch, null, services);
    const rendered = TestRenderer.create(component);
    expect(rendered).toMatchSnapshot();
  });
});

