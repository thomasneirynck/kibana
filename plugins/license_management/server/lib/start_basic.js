const getStartBasicPath = (acknowledge) => `/_xpack/license/start_basic${ acknowledge ? '?acknowledge=true' : ''}`;


export async function startBasic(req, xpackInfo) {
  const { acknowledge } = req.query;
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('admin');
  const options = {
    method: 'POST',
    path: getStartBasicPath(acknowledge)
  };
  try {
    const response = await callWithRequest(req, 'transport.request', options);
    /*eslint camelcase: 0*/
    const { basic_was_started } = response;
    if (basic_was_started) {
      await xpackInfo.refreshNow();
    }
    return response;
  } catch (error) {
    return error.body;
  }
}
