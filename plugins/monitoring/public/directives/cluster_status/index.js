const template = require('plugins/monitoring/directives/cluster_status/index.html');
const module = require('ui/modules').get('monitoring/directives', []);

module.directive('monitoringClusterStatus', (globalState, licenseMode, kbnUrl) => {
  return {
    restrict: 'E',
    template,

    /* The app has the styles of the Bootstrap dropdown component, but not
     * the dropdown JS. So we style the menu as "open" in the markup, and
     * control the actual showing and hiding with this directive. */
    link: (scope) => {
      let isMenuShown = false;

      // show dropdown for cluster listing, with options unselectable
      scope.allowChangeCluster = licenseMode !== 'basic';

      scope.toggleMenu = () => isMenuShown = !isMenuShown;

      scope.showOrHideMenu = () => isMenuShown;

      scope.changeCluster = (uuid) => {
        if (globalState.cluster !== uuid) {
          globalState.cluster = uuid;
          globalState.save();
          kbnUrl.changePath('/overview');
        } else {
          // clicked on current cluster, just hide the dropdown
          isMenuShown = false;
        }
      };

      scope.createClass = (cluster) => {
        const classes = [cluster.status];
        if (licenseMode === 'basic') {
          classes.push('basic');
        }
        return classes.join(' ');
      };

      scope.goToLicense = () => {
        kbnUrl.changePath('/license');
      };

    }
  };
});
