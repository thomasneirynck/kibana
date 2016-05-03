export default (config) => {
  const {username, password} = config.get('elasticsearch');
  const xpackPassword = config.get('xpack.security.kibana.password');
  if (xpackPassword || !(username && password)) {
    config.set('elasticsearch.username', 'kibana');
    config.set('elasticsearch.password', xpackPassword || 'changeme');
  }
};
