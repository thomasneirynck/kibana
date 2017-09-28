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
import { KBN_FIELD_TYPES, ML_JOB_FIELD_TYPES, kbnTypeToMLJobType } from 'plugins/ml/util/field_types_utils';

describe('ML - field type utils', () => {

  describe('kbnTypeToMLJobType', () => {

    it('returns correct ML_JOB_FIELD_TYPES for KBN_FIELD_TYPES', () => {
      const field = {
        type: KBN_FIELD_TYPES.NUMBER,
        aggregatable: true
      };
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.NUMBER);

      field.type = KBN_FIELD_TYPES.DATE;
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.DATE);

      field.type = KBN_FIELD_TYPES.IP;
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.IP);

      field.type = KBN_FIELD_TYPES.BOOLEAN;
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.BOOLEAN);

      field.type = KBN_FIELD_TYPES.GEO_POINT;
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.GEO_POINT);
    });


    it('returns ML_JOB_FIELD_TYPES.KEYWORD for aggregatable KBN_FIELD_TYPES.STRING', () => {
      const field = {
        type: KBN_FIELD_TYPES.STRING,
        aggregatable: true
      };
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.KEYWORD);
    });

    it('returns ML_JOB_FIELD_TYPES.TEXT for non-aggregatable KBN_FIELD_TYPES.STRING', () => {
      const field = {
        type: KBN_FIELD_TYPES.STRING,
        aggregatable: false
      };
      expect(kbnTypeToMLJobType(field)).to.be(ML_JOB_FIELD_TYPES.TEXT);
    });

    it('returns undefined for non-aggregatable "foo"', () => {
      const field = {
        type: 'foo',
        aggregatable: false
      };
      expect(kbnTypeToMLJobType(field)).to.be(undefined);
    });

  });

});
