import { management } from 'ui/management';
import { BASE_PATH } from '../common/constants';

const esSection = management.getSection('elasticsearch');
esSection.register('index_management', {
  visible: true,
  display: 'Index Management',
  order: 1,
  url: `#${BASE_PATH}home`
});

