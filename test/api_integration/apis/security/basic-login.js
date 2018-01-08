import expect from 'expect.js';
import request from 'request';

export default function ({ getService }) {
  const supertest = getService('supertestWithoutAuth');
  const config = getService('config');

  const kibanaServerConfig = config.get('servers.kibana');
  const validUsername = kibanaServerConfig.username;
  const validPassword = kibanaServerConfig.password;

  describe('Basic authentication', function getLanguages() {
    it('should redirect non-AJAX requests to the login page if not authenticated', async () => {
      const response = await supertest.get('/abc/xyz')
        .expect(302);

      expect(response.headers.location).to.be('/login?next=%2Fabc%2Fxyz');
    });

    it('should reject API requests if client is not authenticated', async () => {
      await supertest
        .get('/api/security/v1/me')
        .set('kbn-xsrf', 'xxx')
        .expect(401);
    });

    it('should reject login with wrong credentials', async () => {
      const wrongUsername = `wrong-${validUsername}`;
      const wrongPassword = `wrong-${validPassword}`;

      await supertest.post('/api/security/v1/login')
        .set('kbn-xsrf', 'xxx')
        .send({ username: wrongUsername, password: wrongPassword })
        .expect(401);

      await supertest.post('/api/security/v1/login')
        .set('kbn-xsrf', 'xxx')
        .send({ username: validUsername, password: wrongPassword })
        .expect(401);

      await supertest.post('/api/security/v1/login')
        .set('kbn-xsrf', 'xxx')
        .send({ username: wrongUsername, password: validPassword })
        .expect(401);
    });

    it('should set authentication cookie for login with valid credentials', async () => {
      const loginResponse = await supertest.post('/api/security/v1/login')
        .set('kbn-xsrf', 'xxx')
        .send({ username: validUsername, password: validPassword })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).to.have.length(1);

      const sessionCookie = request.cookie(cookies[0]);
      expect(sessionCookie.key).to.be('sid');
      expect(sessionCookie.value).to.not.be.empty();
      expect(sessionCookie.path).to.be('/');
      expect(sessionCookie.httpOnly).to.be(true);
    });

    describe('with session cookie', () => {
      let sessionCookie;
      beforeEach(async () => {
        const loginResponse = await supertest.post('/api/security/v1/login')
          .set('kbn-xsrf', 'xxx')
          .send({ username: validUsername, password: validPassword })
          .expect(200);

        sessionCookie = request.cookie(loginResponse.headers['set-cookie'][0]);
      });

      it('should allow access to the API', async () => {
        // There is no session cookie provided and no server side session should have
        // been established, so request should be rejected.
        await supertest
          .get('/api/security/v1/me')
          .set('kbn-xsrf', 'xxx')
          .expect(401);

        const apiResponse = await supertest
          .get('/api/security/v1/me')
          .set('kbn-xsrf', 'xxx')
          .set('Cookie', sessionCookie.cookieString())
          .expect(200);

        expect(apiResponse.body).to.only.have.keys([
          'username',
          'full_name',
          'email',
          'roles',
          'scope',
          'metadata',
          'enabled'
        ]);
        expect(apiResponse.body.username).to.be(validUsername);
      });

      it('should clear cookie on logout', async ()=> {
        const logoutResponse = await supertest.post('/api/security/v1/logout')
          .set('kbn-xsrf', 'xxx')
          .set('Cookie', sessionCookie.cookieString())
          .expect(204);

        const cookies = logoutResponse.headers['set-cookie'];
        expect(cookies).to.have.length(1);

        const logoutCookie = request.cookie(cookies[0]);
        expect(logoutCookie.key).to.be('sid');
        expect(logoutCookie.value).to.be.empty();
        expect(logoutCookie.path).to.be('/');
        expect(logoutCookie.httpOnly).to.be(true);
        expect(logoutCookie.maxAge).to.be(0);
      });
    });
  });
}
