import expect from 'expect.js';
import { validateMonitoringLicense } from '../validate_monitoring_license';

// valid license pair
const validId = 12;
const validLicense = {
  status: 'status',
  uid: '1234',
  type: 'basic',
  expiry_date_in_millis: '1468601237000',
  hkey: '1c8d0ebb23b93b222112489314acd7e1294843463d4ac5f1195d9f55d0dde494'
};

describe('validate_monitoring_license', () => {
  it('returns true for valid id/license pair', () => {
    const result = validateMonitoringLicense(validId, validLicense);
    expect(result).to.be(true);
  });

  it('returns false for an invalid id/license pair', () => {
    const invalidId = 13;
    const result = validateMonitoringLicense(invalidId, validLicense);
    expect(result).to.be(false);
  });

  it('returns false for no id', () => {
    expect(validateMonitoringLicense(undefined, validLicense)).to.be(false);
    expect(validateMonitoringLicense(null, validLicense)).to.be(false);
  });

  it('returns false for no license', () => {
    expect(validateMonitoringLicense(validId)).to.be(false);
    expect(validateMonitoringLicense(validId, null)).to.be(false);
  });
});
