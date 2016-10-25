import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';

uiRoutes.addSetupWork((Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  return xpackInfo.init().then(() => {
    const navLink = chrome.getNavLinkById('graph');
    if (!navLink) return;

    const showAppLink = xpackInfo.get('features.graph.showAppLink', false);
    navLink.hidden = !showAppLink;
    if (showAppLink) {
      navLink.disabled = !xpackInfo.get('features.graph.enableAppLink', false);
      navLink.tooltip = xpackInfo.get('features.graph.message');
    }
  });
});
