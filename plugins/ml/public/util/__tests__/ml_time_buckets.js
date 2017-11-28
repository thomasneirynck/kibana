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

import ngMock from 'ng_mock';
import expect from 'expect.js';
import moment from 'moment';
import { IntervalHelperProvider } from '../ml_time_buckets';

describe('ML - time buckets', () => {

  let TimeBuckets;
  let autoBuckets;
  let customBuckets;

  beforeEach(() => {
    ngMock.module('kibana');
    ngMock.inject((Private) => {
      // Create the TimeBuckets interval providers for use in the tests.
      TimeBuckets = Private(IntervalHelperProvider);

      autoBuckets = new TimeBuckets();
      autoBuckets.setInterval('auto');

      customBuckets = new TimeBuckets();
      customBuckets.setInterval('auto');
      customBuckets.setBarTarget(500);
      customBuckets.setMaxBars(550);
    });
  });

  describe('default bar target', () => {

    it('returns correct interval for default target with hour bounds', () => {
      const hourBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-01T01:00:00.000') };
      autoBuckets.setBounds(hourBounds);
      const hourResult = autoBuckets.getInterval();
      expect(hourResult.asSeconds()).to.be(60);      // 1 minute
    });

    it('returns correct interval for default target with day bounds', () => {
      const dayBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-02T00:00:00.000') };
      autoBuckets.setBounds(dayBounds);
      const dayResult = autoBuckets.getInterval();
      expect(dayResult.asSeconds()).to.be(1800);    // 30 minutes
    });

    it('returns correct interval for default target with week bounds', () => {
      const weekBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-08T00:00:00.000') };
      autoBuckets.setBounds(weekBounds);
      const weekResult = autoBuckets.getInterval();
      expect(weekResult.asSeconds()).to.be(14400);  // 4 hours
    });

    it('returns correct interval for default target with 30 day bounds', () => {
      const monthBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-31T00:00:00.000') };
      autoBuckets.setBounds(monthBounds);
      const monthResult = autoBuckets.getInterval();
      expect(monthResult.asSeconds()).to.be(86400); // 1 day
    });

    it('returns correct interval for default target with year bounds', () => {
      const yearBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2018-01-01T00:00:00.000') };
      autoBuckets.setBounds(yearBounds);
      const yearResult = autoBuckets.getInterval();
      expect(yearResult.asSeconds()).to.be(604800); // 1 week
    });

    it('returns correct interval as multiple of 3 hours for default target with 2 week bounds', () => {
      const weekBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-15T00:00:00.000') };
      autoBuckets.setBounds(weekBounds);
      const weekResult = autoBuckets.getIntervalToNearestMultiple(10800); // 3 hours
      expect(weekResult.asSeconds()).to.be(32400);  // 9 hours
    });

  });

  describe('custom bar target', () => {

    it('returns correct interval for 500 bar target with hour bounds', () => {
      const hourBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-01T01:00:00.000') };
      customBuckets.setBounds(hourBounds);
      const hourResult = customBuckets.getInterval();
      expect(hourResult.asSeconds()).to.be(10);      // 10 seconds
    });

    it('returns correct interval for 500 bar target with day bounds', () => {
      const dayBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-02T00:00:00.000') };
      customBuckets.setBounds(dayBounds);
      const dayResult = customBuckets.getInterval();
      expect(dayResult.asSeconds()).to.be(300);    // 5 minutes
    });

    it('returns correct interval for 500 bar target with week bounds', () => {
      const weekBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-08T00:00:00.000') };
      customBuckets.setBounds(weekBounds);
      const weekResult = customBuckets.getInterval();
      expect(weekResult.asSeconds()).to.be(1800);  // 30 minutes
    });

    it('returns correct interval for 500 bar target with 30 day bounds', () => {
      const monthBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-01-31T00:00:00.000') };
      customBuckets.setBounds(monthBounds);
      const monthResult = customBuckets.getInterval();
      expect(monthResult.asSeconds()).to.be(7200); // 2 hours
    });

    it('returns correct interval for 500 bar target with year bounds', () => {
      const yearBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2018-01-01T00:00:00.000') };
      customBuckets.setBounds(yearBounds);
      const yearResult = customBuckets.getInterval();
      expect(yearResult.asSeconds()).to.be(86400); // 1 day
    });

    it('returns correct interval as multiple of 3 hours for 500 bar target with 90 day bounds', () => {
      const weekBounds = { min: moment('2017-01-01T00:00:00.000'), max: moment('2017-04-01T00:00:00.000') };
      customBuckets.setBounds(weekBounds);
      const weekResult = customBuckets.getIntervalToNearestMultiple(10800); // 3 hours
      expect(weekResult.asSeconds()).to.be(21600);  // 6 hours
    });

  });

});
