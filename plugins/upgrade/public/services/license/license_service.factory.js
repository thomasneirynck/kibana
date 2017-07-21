import { uiModules } from 'ui/modules';
import { XPackInfoProvider } from 'plugins/xpack_main/services/xpack_info';
import 'ui/url';
import { XPackUpgradeLicenseService } from './license_service';

uiModules.get('xpack/upgrade')
.factory('xpackUpgradeLicenseService', ($injector) => {
  const Private = $injector.get('Private');
  const xpackInfoService = Private(XPackInfoProvider);
  const kbnUrlService = $injector.get('kbnUrl');
  const $timeout = $injector.get('$timeout');

  return new XPackUpgradeLicenseService(xpackInfoService, kbnUrlService, $timeout);
});
