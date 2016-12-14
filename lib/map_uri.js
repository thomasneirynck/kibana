/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

const defaultEngineURL = 'http://localhost:8080/engine/v2';

import readPrelertConfig from './read_prelert_config';

import querystring from 'querystring';
const { resolve } = require('url');

module.exports = function mapUri(server, prefix) {

  // intercept server responses to overwrite authentication headers
  // when connecting to an external url
  server.ext('onPreResponse', (req, reply) => {
    const response = req.response;
    if (response.request &&
       response.request.path === '/prelert_ext/ext') {
      // overwrite authentication from external request header
      // if authentication is set to Basic, a login dialog autimatically opens
      if (response.headers['www-authenticate']) {
        response.headers['www-authenticate'] = 'None';
      }
    }
    return reply.continue();
  });

  const config = server.config();
  const prelertConfig = readPrelertConfig();

  return function (request, done) {
    if (request.path.match('prelert/')) {
      let url = prelertConfig['engine.url'] || defaultEngineURL;
      const path = request.path.replace('/prelert', '');
      if (path) {
        if (/\/$/.test(url)) url = url.substring(0, url.length - 1);
        url += path;
      }
      const query = querystring.stringify(request.query);
      if (query) url += '?' + query;
      done(null, url);

    } else if (request.path.match('prelert_ext/')) {
      if ((request.method === 'get' || request.method === 'post') &&
         request.query &&
         request.query.url) {
        // Replace the auth header for access to node.js with the appropriate
        // one for the remote server
        if (request.headers.prelertextauthorization) {
          request.headers.authorization = request.headers.prelertextauthorization;
        }
        const url = request.query.url;
        done(null, url);
      }
    } else if (request.path.match('prelert_support/')) {
      // pretend endpoint for returning the engine api support bundle
      let url = prelertConfig['engine.url'] || defaultEngineURL;
      url += '/support';
      done(null, url);
    }
  };
};
