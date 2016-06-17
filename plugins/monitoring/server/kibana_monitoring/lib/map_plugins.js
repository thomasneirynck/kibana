import _ from 'lodash';

export default function mapPlugins(plugins) {
  return _.map(plugins, _.partialRight(_.pick, 'name', 'state'));
}
