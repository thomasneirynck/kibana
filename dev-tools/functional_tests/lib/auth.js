import { format as formatUrl } from 'url';

import request from 'request';
import { fromNode as fcb } from 'bluebird';

async function updateCredentials(port, auth, username, password) {
  const result = await fcb(cb => request({
    method: 'PUT',
    uri: formatUrl({
      protocol: 'http:',
      auth,
      hostname: 'localhost',
      port,
      pathname: `/_xpack/security/user/${username}/_password`,
    }),
    json: true,
    body: { password }
  }, (err, httpResponse, body) => {
    cb(err, { httpResponse, body });
  }));

  const { body, httpResponse } = result;
  const { statusCode } = httpResponse;
  if (statusCode !== 200) {
    throw new Error(`${statusCode} response, expected 200 -- ${JSON.stringify(body)}`);
  }
}

export async function setupUsers(log, ftrConfig) {
  const esPort = ftrConfig.get('servers.elasticsearch.port');

  // initialize the elastic user with a password so it can be
  // used to set passwords for other users
  await updateCredentials(esPort, 'elastic:', 'elastic', 'iamsuperuser');

  // track the current credentials for the `elastic` user as
  // they will likely change as we apply updates
  let auth = 'elastic:iamsuperuser';

  // list of updates we need to apply
  const updates = [
    ftrConfig.get('servers.elasticsearch'),
    ftrConfig.get('servers.kibana'),
  ];

  for (const { username, password } of updates) {
    log.info('setting %j user password to %j', username, password);
    await updateCredentials(esPort, auth, username, password);
    if (username === 'elastic') {
      auth = `elastic:${password}`;
    }
  }
}
