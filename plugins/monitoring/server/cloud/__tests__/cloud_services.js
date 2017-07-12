import expect from 'expect.js';
import { CLOUD_SERVICES } from '../cloud_services';
import { AWS } from '../aws';
import { AZURE } from '../azure';
import { GCP } from '../gcp';

describe('cloudServices', () => {
  const expectedOrder = [ AWS, GCP, AZURE ];

  it('iterates in expected order', () => {
    let i = 0;
    for (const service of CLOUD_SERVICES) {
      expect(service).to.be(expectedOrder[i++]);
    }
  });
});
