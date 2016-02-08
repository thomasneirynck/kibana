import {difference} from 'lodash';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', []);
module.filter('difference', () => {
  return (input, negate) => difference(input, negate);
});
