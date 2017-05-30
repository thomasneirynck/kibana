import expect from 'expect.js';

export default function ({ getService, getPageObjects }) {
  const retry = getService('retry');
  const kibanaServer = getService('kibanaServer');
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
      const buttonExists = await PageObjects.reporting.getGenerateReportButtonExists();
      expect(buttonExists).to.be(false);
    };

    const expectEnabledGenerateReportButton = async () => {
      await PageObjects.reporting.openReportingPanel();
      const printPdfButton = await PageObjects.reporting.getGenerateReportButton();
      await retry.try(async () => {
        const isDisabled = await printPdfButton.getProperty('disabled');
        expect(isDisabled).to.be(false);
      });
    };

    const expectReportCanBeCreated = async () => {
      await PageObjects.reporting.clickGenerateReportButton();
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
          expectEnabledGenerateReportButton();
        });

        it('generates a report', async () => expectReportCanBeCreated());
      });
    });

    describe('Discover', () => {
      describe('Generate CSV button', () => {
        it('is not available if new', async () => {
          await PageObjects.common.navigateToApp('discover');
          await expectUnsavedChangesWarning();
        });

        it('becomes available when saved', async () => {
          await PageObjects.discover.saveSearch('my search');
          await PageObjects.header.clickToastOK();
          await expectEnabledGenerateReportButton();
        });

        it('generates a report with data', async () => {
          await PageObjects.reporting.setTimepickerInDataRange();
          await PageObjects.reporting.clickTopNavReportingLink();
          await expectReportCanBeCreated();
        });

        it('generates a report with no data', async () => {
          await PageObjects.reporting.setTimepickerInNoDataRange();
          await PageObjects.reporting.clickTopNavReportingLink();
          await expectReportCanBeCreated();
        });
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
          await expectEnabledGenerateReportButton();
        });

        it('generates a report', async () => expectReportCanBeCreated());
      });
    });
  });
}
