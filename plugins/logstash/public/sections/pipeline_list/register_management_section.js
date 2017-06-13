import { management } from 'ui/management';

management.getSection('logstash').register('pipelines', {
  display: 'Pipelines',
  order: 10,
  url: '#/management/logstash/pipelines/'
});

management.getSection('logstash/pipelines').register('pipeline', {
  visible: false
});

management.getSection('logstash/pipelines/pipeline').register('edit', {
  display: 'Edit',
  order: 1,
  visible: false
});

management.getSection('logstash/pipelines/pipeline').register('new', {
  display: 'New Pipeline',
  order: 1,
  visible: false
});
