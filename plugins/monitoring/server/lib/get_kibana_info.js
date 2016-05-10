import _ from 'lodash';
export default function getKibanaInfo(req, uuid) {
  const callWithRequest = req.server.plugins.monitoring.callWithRequest;
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.index'),
    type: 'kibana',
    meta: 'get_kibana_info',
    id: uuid
  };

  return callWithRequest(req, 'get', params)
  .then(resp => _.get(resp, '_source.kibana.kibana'));
}
