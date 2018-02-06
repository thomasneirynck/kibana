import expect from 'expect.js';
import overviewFixture from './fixtures/overview';

export default function ({ getService }) {
  const supertest = getService('supertest');
  const esArchiver = getService('esArchiver');

  describe('overview', () => {
    describe('with trial license clusters', () => {
      const archive = 'monitoring/singlecluster-green-gold';
      const timeRange = {
        min: '2017-08-23T21:29:35Z',
        max: '2017-08-23T21:47:25Z'
      };

      before('load clusters archive', () => {
        return esArchiver.load(archive);
      });

      after('unload clusters archive', () => {
        return esArchiver.unload(archive);
      });

      it('should load multiple clusters', async () => {
        const { body } = await supertest
          .post('/api/monitoring/v1/clusters/y1qOsQPiRrGtmdEuM3APJw')
          .set('kbn-xsrf', 'xxx')
          .send({ timeRange })
          .expect(200);
        expect(body).to.eql(overviewFixture);
      });
    });
  });
}
