import expect from 'expect.js';
import validateMonitoringLicense from '../validate_monitoring_license';

// valid license
const validLicense = {
  status: 'status',
  uid: '1234',
  type: 'basic',
  expiry_date_in_millis: '1468601237000',
  hkey: '1c8d0ebb23b93b222112489314acd7e1294843463d4ac5f1195d9f55d0dde494'
};

describe('validate_monitoring_license', () => {
  it('valid license', () => {
    const validId = 12;
    const result = validateMonitoringLicense(validId, validLicense);
    expect(result).to.be(true);
  });

  it('invalid license', () => {
    const invalidId = 13;
    const result = validateMonitoringLicense(invalidId, validLicense);
    expect(result).to.be(false);
  });
});
