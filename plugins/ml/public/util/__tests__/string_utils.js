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
  replaceStringTokens,
  detectorToString,
  sortByKey
} from '../string_utils';

describe('ML - string utils', () => {

  describe('replaceStringTokens', () => {

    const testRecord = {
      'job_id':'test_job',
      'result_type':'record',
      'probability':0.0191711,
      'record_score':4.3,
      'bucket_span':300,
      'detector_index':0,
      'timestamp':1454890500000,
      'function':'mean',
      'function_description':'mean',
      'field_name':'responsetime',
      'user':'Des O\'Connor',
      'testfield1':'test$tring=[+-?]',
      'testfield2':'{<()>}',
      'testfield3':'host=\\\\test@uk.dev'
    };

    it('returns correct values without URI encoding', () => {
      const result = replaceStringTokens('user=$user$,time=$timestamp$', testRecord, false);
      expect(result).to.be('user=Des O\'Connor,time=1454890500000');
    });

    it('returns correct values for missing token without URI encoding', () => {
      const result = replaceStringTokens('user=$username$,time=$timestamp$', testRecord, false);
      expect(result).to.be('user=$username$,time=1454890500000');
    });

    it('returns correct values with URI encoding', () => {
      const testString1 = 'https://www.google.co.uk/webhp#q=$testfield1$';
      const testString2 = 'https://www.google.co.uk/webhp#q=$testfield2$';
      const testString3 = 'https://www.google.co.uk/webhp#q=$testfield3$';
      const testString4 = 'https://www.google.co.uk/webhp#q=$user$';

      const result1 = replaceStringTokens(testString1, testRecord, true);
      const result2 = replaceStringTokens(testString2, testRecord, true);
      const result3 = replaceStringTokens(testString3, testRecord, true);
      const result4 = replaceStringTokens(testString4, testRecord, true);

      expect(result1).to.be('https://www.google.co.uk/webhp#q=test%24tring%3D%5B%2B-%3F%5D');
      expect(result2).to.be('https://www.google.co.uk/webhp#q=%7B%3C()%3E%7D');
      expect(result3).to.be('https://www.google.co.uk/webhp#q=host%3D%5C%5Ctest%40uk.dev');
      expect(result4).to.be('https://www.google.co.uk/webhp#q=Des%20O\'Connor');
    });

    it('returns correct values for missing token with URI encoding', () => {
      const testString = 'https://www.google.co.uk/webhp#q=$username$&time=$timestamp$';
      const result = replaceStringTokens(testString, testRecord, true);
      expect(result).to.be('https://www.google.co.uk/webhp#q=$username$&time=1454890500000');
    });

  });

  describe('detectorToString', () => {

    it('returns the correct descriptions for detectors', () => {
      const detector1 = {
        'function':'count',
      };

      const detector2 = {
        'function':'count',
        'by_field_name':'airline',
        'use_null':false
      };

      const detector3 = {
        'function':'mean',
        'field_name':'CPUUtilization',
        'partition_field_name':'region',
        'by_field_name':'host',
        'over_field_name':'user',
        'exclude_frequent':'all'
      };

      expect(detectorToString(detector1)).to.be('count');
      expect(detectorToString(detector2)).to.be('count by airline use_null=false');
      expect(detectorToString(detector3)).to.be(
        'mean(CPUUtilization) by host over user partition_field_name=region exclude_frequent=all');
    });

  });

  describe('sortByKey', () => {
    const obj = {
      'zebra':'stripes',
      'giraffe':'neck',
      'elephant':'trunk'
    };

    const valueComparator = function (value) {
      return value;
    };

    it('returns correct ordering with default comparator', () => {
      const result = sortByKey(obj, false);
      const keys = Object.keys(result);
      expect(keys[0]).to.be('elephant');
      expect(keys[1]).to.be('giraffe');
      expect(keys[2]).to.be('zebra');
    });

    it('returns correct ordering with default comparator and order reversed', () => {
      const result = sortByKey(obj, true);
      const keys = Object.keys(result);
      expect(keys[0]).to.be('zebra');
      expect(keys[1]).to.be('giraffe');
      expect(keys[2]).to.be('elephant');
    });

    it('returns correct ordering with comparator', () => {
      const result = sortByKey(obj, false, valueComparator);
      const keys = Object.keys(result);
      expect(keys[0]).to.be('giraffe');
      expect(keys[1]).to.be('zebra');
      expect(keys[2]).to.be('elephant');
    });

    it('returns correct ordering with comparator and order reversed', () => {
      const result = sortByKey(obj, true, valueComparator);
      const keys = Object.keys(result);
      expect(keys[0]).to.be('elephant');
      expect(keys[1]).to.be('zebra');
      expect(keys[2]).to.be('giraffe');
    });

  });


});
