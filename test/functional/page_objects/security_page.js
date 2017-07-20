import { format as formatUrl, resolve as resolveUrl } from 'url';
import { map as mapAsync } from 'bluebird';

export function SecurityPageProvider({ getService, getPageObjects }) {
  const remote = getService('remote');
  const config = getService('config');
  const retry = getService('retry');
  const find = getService('find');
  const log = getService('log');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const esArchiver = getService('esArchiver');
  const defaultFindTimeout = config.get('timeouts.find');
  const PageObjects = getPageObjects(['common', 'header', 'settings']);


  class SecurityPage {
    async initTests() {
      log.debug('SecurityPage:initTests');
      await esArchiver.load('empty_kibana');
      await kibanaServer.waitForStabilization();
      await kibanaServer.uiSettings.disableToastAutohide();
      await esArchiver.loadIfNeeded('logstash_functional');
      remote.setWindowSize(1600,1000);
    }

    async login(username, password) {
      const [superUsername, superPassword] = config.get('servers.elasticsearch.auth').split(':');

      username = username || superUsername;
      password = password || superPassword;

      await PageObjects.common.navigateToApp('login');
      await testSubjects.find('loginUsername').clearValue().type(username);
      await testSubjects.find('loginPassword').clearValue().type(password);
      await testSubjects.click('loginSubmit');
      await retry.try(() => find.existsByLinkText('Logout'));
    }

    async logout() {
      log.debug('SecurityPage.logout');

      // There is some issue with being automatically logged in after logging out. The retry loop tries to eliminate
      // the issue. Only seems to happen in the test environment.
      await retry.try(async () => {
        const logoutUrl = formatUrl({
          ...config.get('servers.kibana'),
          auth: null,
          pathname: resolveUrl(config.get('servers.kibana.pathname') || '/', 'logout')
        });
        await remote.get(logoutUrl);

        // Even this loop itself doesn't seem to be sufficient enough and sometimes the retry timeouts from
        // being auto logged in so much. This sleep is to try to help avoid that.
        await PageObjects.common.sleep(1000);

        const loginUrl = formatUrl({
          ...config.get('servers.kibana'),
          auth: null,
          pathname: resolveUrl(config.get('servers.kibana.pathname') || '/', 'login')
        });
        await remote.get(loginUrl);

        const currentUrl = await remote.getCurrentUrl();
        if (!currentUrl.includes('login')) {
          throw 'User was automatically logged in after logout.';
        }
      });
    }

    async clickRolesSection() {
      await PageObjects.settings.clickLinkText('Roles');
    }

    async clickUsersSection() {
      await PageObjects.settings.clickLinkText('Users');
    }

    async clickCreateNewUser() {
      await retry.try(() => testSubjects.click('createUserButton'));
    }

    async clickCreateNewRole() {
      await retry.try(() => testSubjects.click('createRoleButton'));
    }

    async getCreateIndexPatternInputFieldExists() {
      return await testSubjects.exists('createIndexPatternNameInput');
    }

    async clickCancelEditUser() {
      await testSubjects.click('userFormCancelButton');
    }

    async clickCancelEditRole() {
      await testSubjects.click('roleFormCancelButton');
    }

    async clickSaveEditUser() {
      const saveButton = await retry.try(() => testSubjects.find('userFormSaveButton'));
      await remote.moveMouseTo(saveButton);
      await saveButton.click();
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickSaveEditRole() {
      const saveButton = await retry.try(() => testSubjects.find('roleFormSaveButton'));
      await remote.moveMouseTo(saveButton);
      await saveButton.click();
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async getDashboardOnlyModeOption() {
      return await retry.try(() => testSubjects.find('dashboardOnlyMode'));
    }

    async getAllAppsViewModeOption() {
      return await retry.try(() => testSubjects.find('allAppsViewMode'));
    }

    async getIsDashboardOnlyMode() {
      const dashOnlyModeRadio = await this.getDashboardOnlyModeOption();
      return await dashOnlyModeRadio.getProperty('checked');
    }

    async selectDashboardOnlyModeRole() {
      const dashOnlyModeRadio = await this.getDashboardOnlyModeOption();
      await dashOnlyModeRadio.click();
    }
    async selectAllAppsViewModeRole() {
      const allAppsRadio = await retry.try(() => testSubjects.find('allAppsViewMode'));
      await allAppsRadio.click();
    }

    async addIndexToRole(index) {
      log.debug(`Adding index ${index} to role`);
      const indexInput = await retry.try(() => find.byCssSelector('[data-test-subj="indicesInput0"] > div > input'));
      await indexInput.type(index);
      await indexInput.type('\n');
    }

    async addPrivilegeToRole(privilege) {
      log.debug(`Adding privilege ${privilege} to role`);
      const privilegeInput =
        await retry.try(() => find.byCssSelector('[data-test-subj="privilegesInput0"] > div > input'));
      await privilegeInput.type(privilege);
      await privilegeInput.type('\n');
    }

    async assignRoleToUser(role) {
      log.debug(`Adding role ${role} to user`);
      const privilegeInput =
        await retry.try(() => find.byCssSelector('[data-test-subj="userFormRolesDropdown"] > div > input'));
      await privilegeInput.type(role);
      await privilegeInput.type('\n');
    }

    async navigateTo() {
      await PageObjects.common.navigateToApp('settings');
    }

    clickElasticsearchUsers() {
      return this.navigateTo()
      .then(() => {
        return remote.setFindTimeout(defaultFindTimeout)
        .findDisplayedByLinkText('Users')
        .click();
      });
    }

    clickElasticsearchRoles() {
      return this.navigateTo()
      .then(() => {
        return remote.setFindTimeout(defaultFindTimeout)
        .findDisplayedByLinkText('Roles')
        .click();
      });
    }


    async getElasticsearchUsers() {
      const users = await testSubjects.findAll('userRow');
      return mapAsync(users, async user => {
        const fullnameElement = await user.findByCssSelector('[data-test-subj="userRowFullName"]');
        const usernameElement = await user.findByCssSelector('[data-test-subj="userRowUserName"]');
        const rolesElement = await user.findByCssSelector('[data-test-subj="userRowRoles"]');
        const isReservedElementVisible = await user.findByCssSelector('td:nth-child(5)');

        return {
          username: await usernameElement.getVisibleText(),
          fullname: await fullnameElement.getVisibleText(),
          roles: (await rolesElement.getVisibleText()).split(',').map(role => role.trim()),
          reserved: (await isReservedElementVisible.getProperty('innerHTML')).includes('userRowReserved')
        };
      });
    }

    async getElasticsearchRoles() {
      const users = await testSubjects.findAll('roleRow');
      return mapAsync(users, async role => {
        const rolenameElement = await role.findByCssSelector('[data-test-subj="roleRowName"]');
        const isReservedElementVisible =  await role.findByCssSelector('td:nth-child(3)');

        return  {
          rolename: await rolenameElement.getVisibleText(),
          reserved: (await isReservedElementVisible.getProperty('innerHTML')).includes('roleRowReserved')
        };
      });
    }

    clickNewUser() {
      return testSubjects.find('createUserButton').click();
    }

    clickNewRole() {
      return testSubjects.find('createRoleButton').click();
    }

    async addUser(userObj) {
      const self = this;
      await this.clickNewUser();
      await testSubjects.find('userFormUserNameInput').type(userObj.username);
      await testSubjects.find('passwordInput').type(userObj.password);
      await testSubjects.find('passwordConfirmationInput')
          .type(userObj.confirmPassword);
      await testSubjects.find('userFormFullNameInput').type(userObj.fullname);
      await testSubjects.find('userFormEmailInput').type(userObj.email);

      function addRoles(role) {
        return role.reduce(function (promise, roleName) {
          return promise
          .then(function () {
            log.debug('Add role: ' + roleName);
            return self.selectRole(roleName);
          })
          .then(function () {
            return PageObjects.common.sleep(1000);
          });

        }, Promise.resolve());
      }
      log.debug('Add roles: ' , userObj.roles);
      await addRoles(userObj.roles || []);
      log.debug('After Add role: , userObj.roleName');
      if (userObj.save === true) {
        await testSubjects.find('userFormSaveButton').click();
      } else {
        await testSubjects.find('userFormCancelButton').click();
      }
    }

    addRole(roleName, userObj) {
      return this.clickNewRole()
        .then(function () {
          // We have to use non-test-subject selectors because this markup is generated by ui-select.
          log.debug('userObj.indices[0].names = ' + userObj.indices[0].names);
          return testSubjects.find('roleFormNameInput').type(roleName);
        })
        .then(function () {
          return remote.setFindTimeout(defaultFindTimeout)
          // We have to use non-test-subject selectors because this markup is generated by ui-select.
          .findByCssSelector('[data-test-subj="indicesInput0"] .ui-select-search')
          .type(userObj.indices[0].names);
        })
        .then(function () {
          return remote.setFindTimeout(defaultFindTimeout)
          // We have to use non-test-subject selectors because this markup is generated by ui-select.
          .findByCssSelector('span.ui-select-choices-row-inner > div[ng-bind-html="indexPattern"]')
          .click();
        })
        .then(function () {
          if (userObj.indices[0].query) {
            return remote.setFindTimeout(defaultFindTimeout)
            .findByCssSelector('[data-test-subj="queryInput0"]')
           .type(userObj.indices[0].query);
          }
        })
        .then(function () {

          function addPriv(priv) {

            return priv.reduce(function (promise, privName) {
              // We have to use non-test-subject selectors because this markup is generated by ui-select.
              return promise
              .then(function () {
                return remote.setFindTimeout(defaultFindTimeout)
                .findByCssSelector('[data-test-subj="privilegesInput0"] .ui-select-search')
                .click();
              })
              .then(function () {
                log.debug('priv item = ' + privName);
                remote.setFindTimeout(defaultFindTimeout)
                .findByCssSelector(`[data-test-subj="privilegeOption-${privName}"]`)
                .click();
              })
              .then(function () {
                return PageObjects.common.sleep(500);
              });

            }, Promise.resolve());
          }
          return addPriv(userObj.indices[0].privileges);
        })
        //clicking the Granted fields and removing the asterix
        .then(function () {

          function addGrantedField(field) {
            return field.reduce(function (promise, fieldName) {
              return promise
              .then(function () {
                return remote.setFindTimeout(defaultFindTimeout)
                .findByCssSelector('[data-test-subj="fieldInput0"] .ui-select-search')
                .type(fieldName + '\t');
              })
              .then(function () {
                return PageObjects.common.sleep(1000);
              });

            }, Promise.resolve());
          }

          if (userObj.indices[0].field_security) {
            // have to remove the '*'
            return remote.setFindTimeout(defaultFindTimeout)
            .findByCssSelector('div[data-test-subj="fieldInput0"] > div > span > span > span > span.ui-select-match-close')
            .click()
            .then(function () {
              return addGrantedField(userObj.indices[0].field_security.grant);
            });
          }
        })    //clicking save button
        .then(function () {
          log.debug('click save button');
          testSubjects.find('roleFormSaveButton').click();
        })
        .then(function () {
          return PageObjects.common.sleep(5000);
        });
    }

    async selectRole(role) {
      const dropdown = await testSubjects.find("userFormRolesDropdown");
      const input = await dropdown.findByCssSelector("input");
      await input.type(role);
      await testSubjects.click(`addRoleOption-${role}`);
      await testSubjects.find(`userRole-${role}`);
    }

    deleteUser(username) {
      let alertText;
      log.debug('Delete user ' + username);
      return remote.findDisplayedByLinkText(username).click()
      .then(() => {
        return PageObjects.header.isGlobalLoadingIndicatorHidden();
      })
      .then(() => {
        log.debug('Find delete button and click');
        return testSubjects.find('userFormDeleteButton').click();
      })
      .then(() => {
        return PageObjects.common.sleep(2000);
      })
      .then (() => {
        return remote.setFindTimeout(defaultFindTimeout)
        .findByCssSelector('.kuiModalBodyText').getVisibleText();
      })
      .then ((alert) => {
        alertText = alert;
        log.debug('Delete user alert text = ' + alertText);
        return testSubjects.find('confirmModalConfirmButton').click();
      })
      .then(() => {
        return alertText;
      });
    }

    getPermissionDeniedMessage() {
      return remote.setFindTimeout(defaultFindTimeout)
        .findDisplayedByCssSelector('span.kuiInfoPanelHeader__title')
        .getVisibleText();
    }
  }
  return new SecurityPage();
}
