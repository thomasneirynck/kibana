import routes from 'ui/routes';
import './components/pipeline_list';

routes
.when('/management/logstash/pipelines/', {
  template: '<pipeline-list></pipeline-list>'
});
