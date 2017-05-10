
export function ReportingPageProvider({ getService, getPageObjects }) {
  const retry = getService('retry');
  const log = getService('log');
  const testSubjects = getService('testSubjects');
  const esArchiver = getService('esArchiver');
  const remote = getService('remote');
  const kibanaServer = getService('kibanaServer');
  const PageObjects = getPageObjects(['common', 'security', 'header', 'settings']);

  class ReportingPage {
    async initTests() {
      log.debug('ReportingPage:initTests');
      await PageObjects.settings.navigateTo();
      await esArchiver.loadIfNeeded('logstash_functional');
      await kibanaServer.uiSettings.replace({
        'dateFormat:tz':'UTC',
        'defaultIndex':'logstash-*'
      });
      await esArchiver.load('reporting');
      remote.setWindowSize(1600,800);
    }

    async clickTopNavReportingLink() {
      await retry.try(() => testSubjects.click('topNavReportingLink'));
    }

    async isReportingPanelOpen() {
      const pdfButtonExists = await this.getPrintPdfButtonExists();
      const unsavedChangesWarningExists = await this.getUnsavedChangesWarningExists();
      const isOpen = pdfButtonExists || unsavedChangesWarningExists;
      log.debug('isReportingPanelOpen: ' + isOpen);
      return isOpen;
    }

    async openReportingPanel() {
      log.debug('openReportingPanel');
      await retry.try(async () => {
        const isOpen = await this.isReportingPanelOpen();

        if (!isOpen) {
          await this.clickTopNavReportingLink();
        }

        const wasOpened = await this.isReportingPanelOpen();
        if (!wasOpened) {
          throw new Error('Reporting panel was not opened successfully');
        }
      });
    }

    async getUnsavedChangesWarningExists() {
      return await testSubjects.exists('unsavedChangesReportingWarning');
    }

    async getPrintPdfButtonExists() {
      return await testSubjects.exists('printPdfButton');
    }

    async getPrintPdfButton() {
      return await retry.try(() => testSubjects.find('printPdfButton'));
    }

    async clickPrintPdfButton() {
      await retry.try(() => testSubjects.click('printPdfButton'));
    }

    async clickReportCompleteOkToastButton() {
      await retry.try(() => testSubjects.click('reportCompleteOkToastButton'));
    }

    async checkForReportingToasts() {
      log.debug('Reporting:checkForReportingToasts');

      // Message varies slightly for each app type, so we'll only check the common suffix.
      const reportQueuedMessageSuffix = 'generation has been queued. You can track its progress under Management.';
      const reportReadyMessageSuffix = 'Pick it up from Management > Kibana > Reporting';

      const reportQueuedMessage = await PageObjects.header.getToastMessage();
      await PageObjects.header.clickToastOK();

      // Unlikely for the second toast show up before this removes the 'report queued' toast, but I've seen it happen,
      // so account for the possibility.
      if (reportQueuedMessage.endsWith(reportReadyMessageSuffix)) {
        // Make sure both toasts get hidden.
        await PageObjects.header.clickToastOK();
        return true;
      }

      // Wait up to a minute for the 'report is ready message
      const reportReadyMessage = await PageObjects.header.getToastMessage(60000);
      log.debug('Reporting:checkForReportingToasts: recieved second toast message: ' + reportReadyMessage);
      await this.clickReportCompleteOkToastButton();

      return reportReadyMessage.endsWith(reportReadyMessageSuffix) &&
        reportQueuedMessage.endsWith(reportQueuedMessageSuffix);
    }

    async setTimepickerInDataRange() {
      log.debug('Reporting:setTimepickerInDataRange');
      const fromTime = '2015-09-19 06:31:44.000';
      const toTime = '2015-09-23 18:31:44.000';
      await PageObjects.header.setAbsoluteRange(fromTime, toTime);
    }
  }

  return new ReportingPage();
}
