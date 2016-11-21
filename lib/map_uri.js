/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */

var defaultEngineURL = "http://localhost:8080/engine/v2";

import readPrelertConfig from './read_prelert_config';

import querystring from 'querystring';
var { resolve } = require('url');

module.exports = function mapUri(server, prefix) {

  // intercept server responses to overwrite authentication headers
  // when connecting to an external url
  server.ext('onPreResponse', function (req, reply) {
    let response = req.response;
    if(response.request &&
       response.request.path === "/prelert_ext/ext") {
      // overwrite authentication from external request header
      // if authentication is set to Basic, a login dialog autimatically opens
      if(response.headers["www-authenticate"]) {
        response.headers["www-authenticate"] = "None";
      }
    }
    return reply.continue();
  });

  var config = server.config();
  var prelertConfig = readPrelertConfig();
  return function (request, done) {
    if(request.path.match("prelert/")) {
      var url = prelertConfig['engine.url'] || defaultEngineURL;
      var path = request.path.replace('/prelert', '');
      if (path) {
        if (/\/$/.test(url)) url = url.substring(0, url.length - 1);
        url += path;
      }
      var query = querystring.stringify(request.query);
      if (query) url += '?' + query;
      done(null, url);

    } else if(request.path.match("prelert_ext/")) {
      if((request.method === "get" || request.method === "post") &&
         request.query &&
         request.query.url){
        // Replace the auth header for access to node.js with the appropriate
        // one for the remote server
        if(request.headers["prelertextauthorization"]) {
          request.headers["authorization"] = request.headers["prelertextauthorization"];
        }
        var url = request.query.url;
        done(null, url);
      }
    } else if(request.path.match("prelert_support/")) {
      // pretend endpoint for returning the engine api support bundle
      var url = prelertConfig['engine.url'] || defaultEngineURL;
      url += "/support"
      done(null, url);

    }
  };
};
