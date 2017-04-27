export default function ({ getService, getPageObjects }) {
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['security']);

  describe('Security', () => {
    describe('Login Page', () => {
      before(async () => {
        await esArchiver.load('empty_kibana');
        await PageObjects.security.logout();
      });

      after(async () => {
        await esArchiver.unload('empty_kibana');
      });

      it('can login', async () => {
        await PageObjects.security.login();
      });
    });
  });
}
