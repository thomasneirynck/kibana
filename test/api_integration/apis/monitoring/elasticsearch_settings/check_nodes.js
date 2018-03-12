import expect from 'expect.js';

export default function ({ getService }) {
  const supertest = getService('supertest');

  describe('check/nodes', () => {
    it('should load multiple clusters', async () => {
      const { body } = await supertest
        .get('/api/monitoring/v1/elasticsearch_settings/check/nodes')
        .expect(200);

      expect(body.found).to.be(true);
      expect(body.reason).to.be.an('object');
      expect(body.reason.data).to.be('false');
      expect(body.reason.property).to.be('xpack.monitoring.enabled');
      expect(body.reason.context).to.not.be.empty(); // this field includes the nodeId, which is dynamic
    });
  });
}
