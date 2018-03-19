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

import { parseInterval } from '../parse_interval';
import expect from 'expect.js';

describe('ML parse interval util', function () {
  it('correctly parses an interval containing unit and value', function () {
    let duration = parseInterval('1d');
    expect(duration.as('d')).to.be(1);

    duration = parseInterval('2y');
    expect(duration.as('y')).to.be(2);

    duration = parseInterval('5M');
    expect(duration.as('M')).to.be(5);

    duration = parseInterval('5m');
    expect(duration.as('m')).to.be(5);

    duration = parseInterval('250ms');
    expect(duration.as('ms')).to.be(250);

    duration = parseInterval('100s');
    expect(duration.as('s')).to.be(100);

    duration = parseInterval('23d');
    expect(duration.as('d')).to.be(23);

    duration = parseInterval('52w');
    expect(duration.as('w')).to.be(52);

    duration = parseInterval('0s');
    expect(duration.as('s')).to.be(0);

    duration = parseInterval('0h');
    expect(duration.as('h')).to.be(0);

  });

  it('correctly handles zero value intervals', function () {
    let duration = parseInterval('0h');
    expect(duration.as('h')).to.be(0);

    duration = parseInterval('0d');
    expect(duration).to.not.be.ok();
  });

  it('returns null for an invalid interval', function () {
    let duration = parseInterval('');
    expect(duration).to.not.be.ok();

    duration = parseInterval(null);
    expect(duration).to.not.be.ok();

    duration = parseInterval('234asdf');
    expect(duration).to.not.be.ok();

    duration = parseInterval('m');
    expect(duration).to.not.be.ok();

    duration = parseInterval('1.5h');
    expect(duration).to.not.be.ok();
  });
});
