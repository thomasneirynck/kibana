import { handleActions } from 'redux-actions';

import { startBasicLicenseStatus } from '../actions/start_basic';

export const startBasicStatus = handleActions({
  [startBasicLicenseStatus](state, { payload }) {
    return payload;
  }
}, {});


