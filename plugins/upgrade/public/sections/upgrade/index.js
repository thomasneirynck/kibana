import _ from 'lodash';
import 'ngreact';

import { management } from 'ui/management';
import routes from 'ui/routes';
import 'plugins/upgrade/services/license';

import { uiModules } from 'ui/modules';
import { UpgradeSection } from '../../components/section';
import 'ui/autoload/styles';
import 'plugins/upgrade/styles/main.less';
import { DEFAULT_VIEW_ID, VIEWS } from '../../lib/constants';


const upgradeSectionConfiguration = management
  .getSection('elasticsearch')
  .register('upgrade_assistant', {
    display: 'Upgrade Assistant',
    order: 5,
    url: '#/management/elasticsearch/upgrade_assistant/'
  });

const app = uiModules.get('apps/management', ['react']);
app.directive('upgradeSection', function (reactDirective) {
  return reactDirective(UpgradeSection);
});

app.value('upgradeUiViewState', {
  currenState: {},
});

routes.when('/management/elasticsearch/upgrade_assistant/:view?', {
  controller: function UpgradeRouteController($routeParams, $scope, $window, upgradeUiViewState) {
    this.defaultViewId = DEFAULT_VIEW_ID;
    this.routeParams = $routeParams;
    this.views = addAbsoluteLocations(upgradeSectionConfiguration.url, VIEWS);
    this.viewState = upgradeUiViewState;
    this.setViewState = (updater) => {
      this.viewState.currenState = {
        ...this.viewState.currenState,
        ...updater(this.viewState.currenState),
      };
    };
    this.registerRouteChangeListener = (listener) => {
      const unregisterListener = $scope.$on('$locationChangeStart', (event, newUrl) => {
        const preventLeaving = listener(newUrl);
        if (preventLeaving) {
          event.preventDefault();
        }
      });
      return unregisterListener;
    };
    this.navigateTo = (url) => { $window.location.href = url; };
  },
  controllerAs: 'upgradeRouteController',
  template: `
    <upgrade-section
      current-view-location="upgradeRouteController.routeParams.view"
      default-view-id="upgradeRouteController.defaultViewId"
      navigate-to="upgradeRouteController.navigateTo"
      register-route-change-listener="upgradeRouteController.registerRouteChangeListener"
      set-view-state="upgradeRouteController.setViewState"
      views="upgradeRouteController.views"
      view-state="upgradeRouteController.viewState.currenState"
    ></upgrade-section>
  `,
});

routes.defaults(/\/management/, {
  resolve: {
    upgradeManagementSection: ($injector) => {
      const licenseService = $injector.get('xpackUpgradeLicenseService');
      const upgradeSection = management.getSection('elasticsearch/upgrade_assistant');

      if (licenseService.showLinks) {
        upgradeSection.show();
      } else {
        upgradeSection.hide();
      }

      if (licenseService.enableLinks) {
        upgradeSection.enable();
        upgradeSection.tooltip = 'Upgrade assistance to next major version';
      } else {
        upgradeSection.disable();
        upgradeSection.tooltip = licenseService.message;
      }
    }
  }
});

function addAbsoluteLocations(sectionUrl, views) {
  return _.mapValues(views, (view) => ({
    ...view,
    absoluteLocation: `${sectionUrl}${view.location}`,
  }));
}
