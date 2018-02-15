/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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

import expect from 'expect.js';
import {
  elasticsearchJsPlugin
} from '../elasticsearch-ml';

describe('ML - Endpoints', () => {

  const PATH_START = '/_xpack/';
  const PATH_START_LENGTH = PATH_START.length;
  const urls = [];

  // Stub objects
  const Client = {
    prototype: {}
  };

  const components = {
    clientAction: {
      factory: function (obj) {
        // add each endpoint URL to a list
        if (obj.urls) {
          obj.urls.forEach((url) => {
            urls.push(url.fmt);
          });
        }
        if (obj.url) {
          urls.push(obj.url.fmt);
        }
      },
      namespaceFactory() {
        return {
          prototype: {}
        };
      }
    }
  };

  // Stub elasticsearchJsPlugin
  elasticsearchJsPlugin(Client, null, components);

  describe('paths', () => {
    it(`should start with ${PATH_START}`, () => {
      urls.forEach((url) => {
        expect(url.substring(0, PATH_START_LENGTH)).to.eql(PATH_START);
      });
    });
  });

});
