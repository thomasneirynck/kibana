import expect from 'expect.js';

export default function ({ getService }) {
  const supertest = getService('supertest');

  describe('set/collection_enabled', () => {
    it('should set collection.enabled to true', async () => {
      const { body } = await supertest
        .put('/api/monitoring/v1/elasticsearch_settings/set/collection_enabled')
        .set('kbn-xsrf', 'xxx')
        .expect(200);

      expect(body).to.eql({ // returns same response every run
        acknowledged: true,
        persistent: {
          xpack: { monitoring: { collection: { enabled: 'true' } } }
        },
        transient: {}
      });
    });
  });
}
