import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const kibanaServer = getService('kibanaServer');
  const testSubjects = getService('testSubjects');
  const log = getService('log');
  const PageObjects = getPageObjects(['reporting', 'common', 'dashboard', 'header', 'discover', 'visualize']);

  describe('Reporting', () => {

    before('initialize tests', async () => {
      await kibanaServer.uiSettings.disableToastAutohide();
      await PageObjects.reporting.initTests();
    });

    const expectUnsavedChangesWarning = async () => {
      await PageObjects.reporting.openReportingPanel();
      const warningExists = await PageObjects.reporting.getUnsavedChangesWarningExists();
      expect(warningExists).to.be(true);
      const buttonExists = await PageObjects.reporting.getPrintPdfButtonExists();
      expect(buttonExists).to.be(false);
    };

    const expectEnabledPrintPdfButton = async () => {
      await PageObjects.reporting.openReportingPanel();
      const printPdfButton = await PageObjects.reporting.getPrintPdfButton();
      const isDisabled = await printPdfButton.getProperty('disabled');
      expect(isDisabled).to.be(false);
    };

    const expectReportCanBeCreated = async () => {
      await PageObjects.reporting.clickPrintPdfButton();
      const success = await PageObjects.reporting.checkForReportingToasts();
      expect(success).to.be(true);
    };

    describe('Dashboard', () => {
      describe('Print PDF button', () => {
        it('is not available if new', async () => {
          await PageObjects.common.navigateToApp('dashboard');
          await PageObjects.dashboard.clickNewDashboard();
          await expectUnsavedChangesWarning();
        });

        it('becomes available when saved', async () => {
          await PageObjects.dashboard.saveDashboard('mydash');
          await PageObjects.header.clickToastOK();
          expectEnabledPrintPdfButton();
        });

        it('generates a report', async () => expectReportCanBeCreated());
      });
    });

    describe('Discover', () => {
      describe('Print PDF button', () => {
        it('is not available if new', async () => {
          await PageObjects.common.navigateToApp('discover');
          await expectUnsavedChangesWarning();
        });

        it('becomes available when saved', async () => {
          await PageObjects.discover.saveSearch('my search');
          await PageObjects.header.clickToastOK();
          await expectEnabledPrintPdfButton();
        });

        it('generates a report with data', async () => {
          await PageObjects.reporting.setTimepickerInDataRange();
          await PageObjects.reporting.clickTopNavReportingLink();
          await expectReportCanBeCreated();
        });

        // TODO: uncomment this when https://github.com/elastic/x-pack-kibana/issues/1103 is fixed.
        // it('generates a report with no data', async () => {
        //   const fromTime = '1999-09-19 06:31:44.000';
        //   const toTime = '1999-09-23 18:31:44.000';
        //   await PageObjects.header.setAbsoluteRange(fromTime, toTime);
        //   await expectReportCanBeCreated();
        // });
      });
    });

    describe('Visualize', () => {
      describe('Print PDF button', () => {
        it('is not available if new', async () => {
          await PageObjects.common.navigateToUrl('visualize', 'new');
          await PageObjects.visualize.clickAreaChart();
          await PageObjects.visualize.clickNewSearch();
          await expectUnsavedChangesWarning();
        });

        it('becomes available when saved', async () => {
          await PageObjects.visualize.saveVisualization('my viz');
          await PageObjects.header.clickToastOK();
          await expectEnabledPrintPdfButton();
        });

        it('generates a report', async () => expectReportCanBeCreated());
      });
    });
  });
}
