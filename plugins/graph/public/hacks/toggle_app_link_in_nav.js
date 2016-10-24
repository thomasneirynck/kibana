import chrome from 'ui/chrome';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import uiModules from 'ui/modules';

function toggleAppLinkInNav(Private) {
  const xpackInfo = Private(XPackInfoProvider);

  const navLink = chrome.getNavLinkById('graph');

  const showAppLink = xpackInfo.get('features.graph.showAppLink', false);
  navLink.hidden = !showAppLink;
  if (showAppLink) {
    navLink.disabled = !xpackInfo.get('features.graph.enableAppLink', false);
    navLink.tooltip = xpackInfo.get('features.graph.message');
  }
}

uiModules.get('kibana').run(toggleAppLinkInNav);
