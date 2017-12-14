import expect from 'expect.js';
import { indexBy } from 'lodash';

const watchID = "watchID";
const watchName = "watch Name";
const updatedName = "updatedName";
export default function ({ getService, getPageObjects }) {
  const remote = getService('remote');
  const testSubjects = getService('testSubjects');
  const log = getService('log');
  const PageObjects = getPageObjects(['security', 'common', 'header', 'settings', 'watcher']);

  describe('watcher_test', function () {
    before('initialize tests', async () => {
      await remote.setWindowSize(1600, 1000);
      await PageObjects.common.navigateToApp('settings');
      await PageObjects.settings.clickLinkText('Watcher');
      await PageObjects.watcher.clearAllWatches();
    });

    it('create and save a new watch', async () => {
      const expectedMessage =
        `Watcher: Saved Watch "${watchName}"`;
      await PageObjects.watcher.createWatch(watchID, watchName);
      const actualMessage = await PageObjects.header.getToastMessage();
      expect(actualMessage).to.be(expectedMessage);
      await PageObjects.header.clickToastOK();
      const watch = await PageObjects.watcher.getWatch(watchID);
      expect(watch.id).to.be(watchID);
      expect(watch.name).to.be(watchName);
    });

    it('should prompt user to check to see if you can override a watch with a sameID', async () => {
      const expectedMessage =
        `Watcher: Saved Watch "${updatedName}"`;
      await PageObjects.watcher.createWatch(watchID, updatedName);
      const modal = await testSubjects.find("confirmModalBodyText");
      const modalText =  await modal.getVisibleText();
      expect(modalText).to.be(`Watch with ID "${watchID}" (name: "${watchName}") already exists. Do you want to overwrite it?`);
      await testSubjects.click('confirmModalConfirmButton');
      const actualMessage = await PageObjects.header.getToastMessage();
      expect(actualMessage).to.be(expectedMessage);
      await PageObjects.header.clickToastOK();
      const watch = await PageObjects.watcher.getWatch(watchID);
      expect(watch.id).to.be(watchID);
      expect(watch.name).to.be(updatedName);
    });

    //delete the watch
    it('should delete the watch', async () => {
      const expectedMessage =
        `Watcher: Deleted 1 out of 1 selected Watch`;
      const watchList = indexBy(await PageObjects.watcher.getWatches(), 'id');
      log.debug(watchList);
      expect(watchList.watchID.name).to.eql([updatedName]);
      await PageObjects.watcher.deleteWatch(watchID);
      const modal = await testSubjects.find("confirmModalBodyText");
      const modalText =  await modal.getVisibleText();
      expect(modalText).to.be('This will permanently delete 1 Watch. Are you sure?');
      await testSubjects.click('confirmModalConfirmButton');
      await PageObjects.header.waitUntilLoadingHasFinished();
      const actualMessage = await PageObjects.header.getToastMessage();
      expect(actualMessage).to.be(expectedMessage);
      await PageObjects.header.clickToastOK();
      const watchList1 = indexBy(await PageObjects.watcher.getWatches(), 'id');
      log.debug(watchList1);
      expect(watchList1).to.not.have.key(watchID);
    });

  });
}
