import uiModules from 'ui/modules';
import chrome from 'ui/chrome';

const module = uiModules.get('security');
module.service('LoginPage', ($window) => {
  return {
    isOnLoginPage() {
      return (chrome.removeBasePath($window.location.pathname) === '/login');
    }
  };
});
