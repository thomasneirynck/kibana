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
import { getSafeFieldName } from '../new_job_utils';

describe('ML - new job utils', () => {

  describe('getSafeFieldName', () => {
    it('"foo" should be "foo"', () => {
      expect(getSafeFieldName('foo', 0)).to.be('foo');
    });
    it('"foo.bar" should be "foo.bar"', () => {
      expect(getSafeFieldName('foo.bar', 0)).to.be('foo.bar');
    });
    it('"foo&bar" should be "field_0"', () => {
      expect(getSafeFieldName('foo&bar', 0)).to.be('field_0');
    });

  });
});
