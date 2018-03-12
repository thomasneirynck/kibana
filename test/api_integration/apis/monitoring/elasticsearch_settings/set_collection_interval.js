import expect from 'expect.js';

export default function ({ getService }) {
  const supertest = getService('supertest');

  describe.skip('set/collection_interval', () => {
    it('should set collection.interval to 10s', async () => {
      const { body } = await supertest
        .put('/api/monitoring/v1/elasticsearch_settings/set/collection_interval')
        .set('kbn-xsrf', 'xxx')
        .expect(200);

      expect(body).to.eql({ // returns same response every run
        acknowledged: true,
        persistent: {
          xpack: { monitoring: { collection: { interval: '10s' } } }
        },
        transient: {}
      });
    });
  });
}
