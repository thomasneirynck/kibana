import { ExtractError } from './extract';
import { ensureBrowserDownloaded } from './download';
import { installBrowser } from './install';

export async function createBrowserDriverFactory(server) {
  const config = server.config();

  const DATA_DIR = config.get('path.data');
  const BROWSER_TYPE = config.get('xpack.reporting.capture.browser.type');
  const BROWSER_AUTO_DOWNLOAD = config.get('xpack.reporting.capture.browser.autoDownload');

  if (BROWSER_AUTO_DOWNLOAD) {
    await ensureBrowserDownloaded(BROWSER_TYPE);
  }

  try {
    const browserDriverFactory = await installBrowser(BROWSER_TYPE, DATA_DIR);
    server.log(['reporting', 'debug'], `Browser installed at ${browserDriverFactory.binaryPath}`);
    return browserDriverFactory;
  } catch (error) {
    if (error instanceof ExtractError) {
      server.log(['reporting', 'error'], 'Failed to install browser. See kibana logs for more details.');
      throw error;
    }

    server.log(['reporting', 'error'], error);

    if (error.cause) {
      server.log(['reporting', 'error'], error.cause);

      if (['EACCES', 'EEXIST'].includes(error.cause.code)) {
        throw new Error(
          'Insufficient permissions for extracting the browser archive. ' +
          'Make sure the Kibana data directory (path.data) is owned by the same user that is running Kibana.'
        );
      }
    }

    throw new Error('Failed to extract the browser archive. See kibana logs for more details.');
  }
}
