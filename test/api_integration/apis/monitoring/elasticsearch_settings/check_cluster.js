import expect from 'expect.js';

export default function ({ getService }) {
  const supertest = getService('supertest');

  describe('check/cluster', () => {
    it('should get cluster settings', async () => {
      const { body } = await supertest
        .get('/api/monitoring/v1/elasticsearch_settings/check/cluster')
        .expect(200);

      expect(body).to.eql({
        found: true,
        reason: {
          context: 'cluster defaults',
          data: 'false',
          property: 'xpack.monitoring.enabled'
        }
      });
    });
  });
}
