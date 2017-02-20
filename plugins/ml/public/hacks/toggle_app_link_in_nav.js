import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import chrome from 'ui/chrome';
import uiModules from 'ui/modules';

uiModules.get('xpack/ml').run((Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  const navLink = chrome.getNavLinkById('ml');
  if (!navLink) return;

  // hide by default, only show once the xpackInfo is initialized
  navLink.hidden = true;
  const showAppLink = xpackInfo.get('features.ml.showAppLink', false);
  navLink.hidden = !showAppLink;
  if (showAppLink) {
    navLink.disabled = !xpackInfo.get('features.ml.enableAppLink', false);
    navLink.tooltip = xpackInfo.get('features.ml.message');
  }
});
