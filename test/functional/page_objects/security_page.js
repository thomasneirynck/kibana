import { format as formatUrl, resolve as resolveUrl } from 'url';
import { map as mapAsync } from 'bluebird';

export function SecurityPageProvider({ getService, getPageObjects }) {
  const remote = getService('remote');
  const config = getService('config');
  const retry = getService('retry');
  const log = getService('log');
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const esArchiver = getService('esArchiver');
  const PageObjects = getPageObjects(['common', 'header']);
  const defaultFindTimeout = config.get('timeouts.find');

  class SecurityPage {
    async initTests() {
      await kibanaServer.uiSettings.disableToastAutohide();
      log.debug('SecurityPage:initTests');
      await esArchiver.load('empty_kibana');
      await esArchiver.loadIfNeeded('logstash_functional');
      remote.setWindowSize(1600,1000);
    }

    async login() {
      const [username, password] = config.get('servers.elasticsearch.auth').split(':');

      await PageObjects.common.navigateToApp('login');
      await testSubjects.find('loginUsername').type(username);
      await testSubjects.find('loginPassword').type(password);
      await testSubjects.click('loginSubmit');
      await retry.try(() => testSubjects.exists('kibanaChrome'));
    }

    async logout() {
      await remote.get(formatUrl({
        ...config.get('servers.kibana'),
        auth: null,
        pathname: resolveUrl(config.get('servers.kibana.pathname') || '/', 'logout')
      }));
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
      await retry.try(() => testSubjects.click('userFormCancelButton'));
    }

    async clickCancelEditRole() {
      await retry.try(() => testSubjects.click('roleFormCancelButton'));
    }

    async clickSaveEditUser() {
      await retry.try(() => testSubjects.click('userFormSaveButton'));
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    async clickSaveEditRole() {
      await retry.try(() => testSubjects.click('roleFormSaveButton'));
      await PageObjects.header.waitUntilLoadingHasFinished();
    }

    getLoginButtonExists() {
      return retry.try(() => testSubjects.exists('loginSubmit'));
    }


    navigateTo() {
      return PageObjects.common.navigateToApp('settings')
      .then(() => {
        return remote.setFindTimeout(defaultFindTimeout)
        .findDisplayedByLinkText('Security')
        .click();
      });
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
          roles: (await rolesElement.getVisibleText()).split(', '),
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

    addUser(userObj) {
      const self = this;
      return this.clickNewUser()
      .then(function () {
        return testSubjects.find('userFormUserNameInput').type(userObj.username);
      })
      .then(function () {
        return testSubjects.find('passwordInput').type(userObj.password);
      })
      .then(function () {
        return testSubjects.find('passwordConfirmationInput')
          .type(userObj.confirmPassword);
      })
      .then(function () {
        return testSubjects.find('userFormFullNameInput').type(userObj.fullname);
      })
      .then(function () {
        return testSubjects.find('userFormEmailInput').type(userObj.email);
      })
      .then(function () {
        function addRoles(role) {
          return role.reduce(function (promise, roleName) {
            return promise
            .then(function () {
              return PageObjects.common.sleep(500);
            })
            .then(function () {
              log.debug('Add role: ' + roleName);
              return self.selectRole(roleName);
            })
            .then(function () {
              return PageObjects.common.sleep(500);
            });

          }, Promise.resolve());
        }
        return addRoles(userObj.roles || []);
      })
      .then(function () {
        if (userObj.save === true) {
          return testSubjects.find('userFormSaveButton').click();
        } else {
          return testSubjects.find('userFormCancelButton').click();
        }
      });
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
                console.log('priv item = ' + privName);
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
                return PageObjects.common.sleep(500);
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
        });
    }

    selectRole(role) {
      // We have to use non-test-subject selectors because this markup is generated by ui-select.
      return remote.setFindTimeout(defaultFindTimeout)
      .findByCssSelector('[data-test-subj="userFormRolesDropdown"] div input[aria-label="Select box"]')
      .click()
      .type(role)
      .then(() => {
        remote.setFindTimeout(defaultFindTimeout)
        .findByCssSelector('div[ng-bind-html="role"]')
        .click();
      });
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
