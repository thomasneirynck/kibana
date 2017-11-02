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
import { chartLimits, numTicks } from '../chart_utils';

describe('ML - chart utils', () => {

  describe('chartLimits', () => {

    it('returns NaN when called without data', () => {
      const limits = chartLimits();
      expect(limits.min).to.be.NaN;
      expect(limits.max).to.be.NaN;
    });

    it('returns {max: 625736376, min: 201039318} for some test data', () => {
      const data = [
        {
          date: new Date('2017-02-23T08:00:00.000Z'),
          value: 228243469, anomalyScore: 63.32916, numberOfCauses: 1,
          actual: [228243469], typical: [133107.7703441773]
        },
        { date: new Date('2017-02-23T09:00:00.000Z'), value: null },
        { date: new Date('2017-02-23T10:00:00.000Z'), value: null },
        { date: new Date('2017-02-23T11:00:00.000Z'), value: null },
        {
          date: new Date('2017-02-23T12:00:00.000Z'),
          value: 625736376, anomalyScore: 97.32085, numberOfCauses: 1,
          actual: [625736376], typical: [132830.424736973]
        },
        {
          date: new Date('2017-02-23T13:00:00.000Z'),
          value: 201039318, anomalyScore: 59.83488, numberOfCauses: 1,
          actual: [201039318], typical: [132739.5267403542]
        }
      ];

      const limits = chartLimits(data);

      // {max: 625736376, min: 201039318}
      expect(limits.min).to.be(201039318);
      expect(limits.max).to.be(625736376);
    });

    it('adds 5% padding when min/max are the same, e.g. when there\'s only one data point', () => {
      const data = [
        {
          date: new Date('2017-02-23T08:00:00.000Z'),
          value: 100, anomalyScore: 50, numberOfCauses: 1,
          actual: [100], typical: [100]
        }
      ];

      const limits = chartLimits(data);
      expect(limits.min).to.be(95);
      expect(limits.max).to.be(105);
    });

  });

  describe('numTicks', () => {

    it('returns 10 for 1000', () => {
      expect(numTicks(1000)).to.be(10);
    });

  });

});
