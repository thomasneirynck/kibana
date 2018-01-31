import { unmountComponentAtNode } from 'react-dom';

export const manageAngularLifecycle = ($scope, $route, elem) => {
  const lastRoute = $route.current;

  const deregister = $scope.$on('$locationChangeSuccess', () => {
    const currentRoute = $route.current;
    if (lastRoute.$$route.template === currentRoute.$$route.template) {
      $route.current = lastRoute;
    }
  });

  $scope.$on('$destroy', () => {
    deregister && deregister();
    elem && unmountComponentAtNode(elem);
  });
};
