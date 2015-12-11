var moment = require('moment');
require('plugins/reporting/less/main.less');
require('ui/chrome').setNavBackground('#222222').setTabs([]);

var app = require('ui/modules').get('app/reporting', []);

require('ui/routes')
  .when('/', {
    template: require('plugins/reporting/templates/index.html'),
    resolve: {
      currentTime: function ($http) {
        return $http.get('/reporting/api/example')
        .then(function (resp) {
          return resp.data.time;
        });
      }
    }
  });

app.controller('reportingHelloWorld', function ($scope, $route, $interval) {
  $scope.title = 'Reporting';
  $scope.description = 'An awesome Kibana reporting plugin';

  var currentTime = moment($route.current.locals.currentTime);
  $scope.currentTime = currentTime.format('HH:mm:ss');
  var unsubscribe = $interval(function () {
    $scope.currentTime = currentTime.add(1, 'second').format('HH:mm:ss');
  }, 1000);
  $scope.$watch('$destroy', unsubscribe);
});
