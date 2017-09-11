import expect from 'expect.js';
import path from 'path';
import mkdirp from 'mkdirp';
import fs from 'fs';
import { promisify } from 'bluebird';
import { checkIfPdfsMatch } from './lib';
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(mkdirp);
const os = require('os');

const REPORTS_FOLDER = path.resolve(__dirname, 'reports');

export default function ({ getService, getPageObjects }) {
  const retry = getService('retry');
  const kibanaServer = getService('kibanaServer');
  const config = getService('config');
  const PageObjects = getPageObjects(['reporting', 'common', 'dashboard', 'header', 'discover', 'visualize']);
  const log = getService('log');

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

    const writeSessionReport = async (name, rawPdf) => {
      const sessionDirectory = path.resolve(REPORTS_FOLDER, 'session');
      await mkdirAsync(sessionDirectory);
      const sessionReportPath = path.resolve(sessionDirectory, `${name}_${os.platform()}.pdf`);
      await writeFileAsync(sessionReportPath, rawPdf);
      return sessionReportPath;
    };

    const getBaselineReportPath = (fileName) => {
      const baselineFolder = path.resolve(REPORTS_FOLDER, 'baseline');
      return path.resolve(baselineFolder, `${fileName}_${os.platform()}.pdf`);
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
          await expectEnabledGenerateReportButton();
        });

        it('single bar chart matches baseline report', async function () {
          // Generating and then comparing reports can take longer than the default 60s timeout.
          this.timeout(120000);

          await PageObjects.dashboard.clickEdit();
          await PageObjects.reporting.setTimepickerInDataRange();
          await PageObjects.dashboard.addVisualizations(['Visualization☺ VerticalBarChart']);
          await PageObjects.dashboard.saveDashboard('basic chart report test');
          await PageObjects.header.clickToastOK();
          await PageObjects.reporting.openReportingPanel();
          await PageObjects.reporting.clickGenerateReportButton();
          await PageObjects.reporting.clickDownloadReportButton();

          const url = await PageObjects.reporting.getUrlOfTab(1);
          const reportData = await PageObjects.reporting.getRawPdfReportData(url);
          const reportFileName = 'one_bar_chart';
          const sessionReportPath = await writeSessionReport(reportFileName, reportData);
          const diffCount = await checkIfPdfsMatch(
            sessionReportPath,
            getBaselineReportPath(reportFileName),
            config.get('screenshots.directory'),
            log
          );
          expect(diffCount).to.be(0);
        });

        it('bar and area chart match baseline', async function () {
          // Generating and then comparing reports can take longer than the default 60s timeout.
          this.timeout(120000);

          await PageObjects.dashboard.clickEdit();
          await PageObjects.dashboard.addVisualizations(['Visualization漢字 AreaChart']);
          await PageObjects.dashboard.saveDashboard('basic chart report test');
          await PageObjects.header.clickToastOK();
          await PageObjects.reporting.openReportingPanel();
          await PageObjects.reporting.clickGenerateReportButton();
          await PageObjects.reporting.clickDownloadReportButton();

          const url = await PageObjects.reporting.getUrlOfTab(2);
          const reportData = await PageObjects.reporting.getRawPdfReportData(url);
          const reportFileName = 'bar_area_chart';
          const sessionReportPath = await writeSessionReport(reportFileName, reportData);

          const diffCount = await checkIfPdfsMatch(
            sessionReportPath,
            getBaselineReportPath(reportFileName),
            config.get('screenshots.directory'),
            log
          );
          expect(diffCount).to.be(0);
        });
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

        it('generates a report', async () => await expectReportCanBeCreated());
      });
    });
  });
}
