import uiRoutes from 'ui/routes';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';

uiRoutes.addSetupWork((Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  return xpackInfo.init();
});
