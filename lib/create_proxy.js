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

import mapUri from './map_uri';
const { resolve } = require('url');
module.exports = function createProxy(server, method, route, config) {

  const pre = '';
  const sep = route[0] === '/' ? '' : '/';
  const path = `${pre}${sep}${route}`;
  const options = {
    method: method,
    path: path,
    handler: {
      proxy: {
        mapUri: mapUri(server),
        passThrough: true,
        xforward: true,
        timeout: 600000
      }
    },
  };

  if (config) {
    options.config = config;
  }

  server.route(options);
};

