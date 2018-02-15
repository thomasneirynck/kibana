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
import { renderTemplate } from '../string_utils';

describe('ML - string utils', () => {
  describe('renderTemplate', () => {

    it('returns plain string', () => {
      const templateString = 'plain string';
      const result = renderTemplate(templateString);
      expect(result).to.be(result);
    });
    it('returns rendered template with one replacement', () => {
      const templateString = 'string with {{one}} replacement';
      const result = renderTemplate(templateString, { one: '1' });
      expect(result).to.be('string with 1 replacement');
    });
    it('returns rendered template with two replacements', () => {
      const templateString = 'string with {{one}} replacement, and a {{two}} one.';
      const result = renderTemplate(templateString, { one: '1', two: '2nd' });
      expect(result).to.be('string with 1 replacement, and a 2nd one.');
    });

  });
});
