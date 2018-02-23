import routes from 'ui/routes';
import { toastNotifications } from 'ui/notify';
import { XPackInfoProvider } from 'plugins/xpack_main/services/xpack_info';
import template from './grokdebugger_route.html';
import './components/grokdebugger';

routes
  .when('/dev_tools/grokdebugger', {
    template: template,
    resolve: {
      licenseCheckResults(Private) {
        const xpackInfo = Private(XPackInfoProvider);
        return {
          showPage: xpackInfo.get('features.grokdebugger.enableLink'),
          message: xpackInfo.get('features.grokdebugger.message')
        };
      }
    },
    controller: class GrokDebuggerRouteController {
      constructor($injector) {
        const $route = $injector.get('$route');
        const kbnUrl = $injector.get('kbnUrl');

        const licenseCheckResults = $route.current.locals.licenseCheckResults;
        if (!licenseCheckResults.showPage) {
          kbnUrl.change('/dev_tools');
          toastNotifications.addDanger(licenseCheckResults.message);
          return;
        }
      }
    }
  });
