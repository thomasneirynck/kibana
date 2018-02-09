import chrome from 'ui/chrome';
import { PathProvider } from 'plugins/xpack_main/services/path';

import { renderBanner } from './render_banner';
import { shouldShowBanner } from './should_show_banner';

/**
 * Add the Telemetry opt-in banner if the user has not already made a decision.
 *
 * Note: this is an async function, but Angular fails to use it as one. Its usage does not need to be awaited,
 * and thus it can be wrapped in the run method to just be a normal, non-async function.
 *
 * @param {Object} $injector The Angular injector
 */
async function asyncInjectBanner($injector) {
  const reportStats = $injector.get('reportStats');
  const Private = $injector.get('Private');
  const config = $injector.get('config');

  // no banner if the server config has telemetry disabled
  if (!reportStats) {
    return;
  }

  // and no banner for non-logged in users
  if (Private(PathProvider).isLoginOrLogout()) {
    return;
  }

  // and no banner on status page
  if (chrome.getApp().id === 'status_page') {
    return;
  }

  // determine if the banner should be displayed
  if (await shouldShowBanner(config)) {
    renderBanner(config);
  }
}

/**
 * Add the Telemetry opt-in banner when appropriate.
 *
 * @param {Object} $injector The Angular injector
 */
export function injectBanner($injector) {
  asyncInjectBanner($injector);
}