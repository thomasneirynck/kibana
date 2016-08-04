import expect from 'expect.js';
import sinon from 'sinon';
import { findIndexByX, setLegendByX, setLegendForSeriesIndex } from '../chart_helpers';

describe('monitoringChartHelpers', function () {

  class MockPlot {

    constructor(datasets, axes) {
      this.datasets = datasets;
      this.axes = axes;
    }

    getData() {
      return this.datasets;
    }

    getAxes() {
      return this.axes;
    }

  }

  it('setLegendForSeriesIndex sets does not impact legend without series', () => {
    const legend = sinon.stub();
    const plot = new MockPlot([], null);

    setLegendForSeriesIndex(legend, plot, 0);
    expect(legend.called).to.be(false);
  });

  it('setLegendForSeriesIndex sets legend correctly', () => {
    const expected = [null, null, null, null];
    const expectedSeries = [null, null, null, null];
    const legend = sinon.spy((series, index, value) => {
      expectedSeries[index] = series;
      expected[index] = value;
    });
    const datasets = [
      // 4 series, with all but the first containing 3 points, and one of those has a gap:
      { data: [] },
      { data: [ [15, 1.1], [17, 11.1], null ], _meta: { metric: { format: '0.0', units: '/s' } } },
      { data: [ [15, 2.2], [17, 22.2], [19, 2560] ], _meta: { metric: { format: '0,0.0', units: 'B' } } },
      { data: [ [15, 3.3], [17, 33.3], [19, null] ] }
    ];
    // axes aren't used when using the index
    const plot = new MockPlot(datasets, null);

    setLegendForSeriesIndex(legend, plot, 0);
    expect(legend.callCount).to.be(expected.length);
    expect(expected).to.eql([null, 1.1, 2.2, 3.3]);
    expect(expectedSeries).to.eql(datasets);

    setLegendForSeriesIndex(legend, plot, 1);
    expect(legend.callCount).to.be(2 * expected.length);
    expect(expected).to.eql([null, 11.1, 22.2, 33.3]);
    expect(expectedSeries).to.eql(datasets);

    setLegendForSeriesIndex(legend, plot, 2);
    expect(legend.callCount).to.be(3 * expected.length);
    expect(expected).to.eql([null, null, 2560, null]);
    expect(expectedSeries).to.eql(datasets);
  });

  it('setLegendByX ignores legend when plot axes are outside of range', () => {
    const legend = sinon.stub();
    const axes = { xaxis: { min: 10, max: 20 } };
    const plot = new MockPlot(null, axes);

    setLegendByX(legend, plot, 5);
    expect(legend.called).to.be(false);

    setLegendByX(legend, plot, 25);
    expect(legend.called).to.be(false);
  });

  it ('setLegendByX calls with the right index', () => {
    // the actual value should be set based on the data from each series
    const expected = [ null, null, null, null ];
    const legend = sinon.spy((_series, index, value) => {
      expected[index] = value;
    });
    const axes = { xaxis: { min: 14, max: 20 } };
    const datasets = [
      // 4 series, with all but the first containing 3 points, and one of those has a gap:
      { data: [] },
      { data: [ [15, 1], [17, 11], [19, 21] ] },
      { data: [ [15, 2], null,     [19, 22] ] },
      { data: [ [15, 3], [17, 13], [19, 23] ] }
    ];
    const plot = new MockPlot(datasets, axes);

    setLegendByX(legend, plot, 14);
    expect(legend.callCount).to.be(expected.length);
    expect(expected).to.eql([null, 1, 2, 3]);

    setLegendByX(legend, plot, 17);
    expect(legend.callCount).to.be(2 * expected.length);
    expect(expected).to.eql([null, 11, null, 13]);

    setLegendByX(legend, plot, 20);
    expect(legend.callCount).to.be(3 * expected.length);
    expect(expected).to.eql([null, 21, 22, 23]);
  });

  it('findIndexByX returns 0 when only one element exists', () => {
    // the value shouldn't even be considered
    const oneElement = [ {} ];

    expect(findIndexByX(oneElement, 12345)).to.be(0);
    expect(findIndexByX(oneElement, -12345)).to.be(0);
  });

  it('findIndexByX returns -1 when it is empty', () => {
    expect(findIndexByX([], 12345)).to.be(-1);
    expect(findIndexByX([], -12345)).to.be(-1);
  });

  it('findIndexByX returns correct index without leading data', () => {
    // unlikely edge case where the first (few) values don't exist
    const data = [
      null,
      null,
      [ 15 ],
      [ 16 ],
      [ 30 ]
    ];

    // given an equal distance, it should use the one that exceeded the X value
    expect(findIndexByX(data, -500)).to.be(2);
    expect(findIndexByX(data, 0)).to.be(2);
    expect(findIndexByX(data, 5)).to.be(2);
    expect(findIndexByX(data, 7.4999)).to.be(2);
    expect(findIndexByX(data, 7.5)).to.be(2);
    expect(findIndexByX(data, 7.5001)).to.be(2);
    expect(findIndexByX(data, 15)).to.be(2);
    expect(findIndexByX(data, 15.4999)).to.be(2);
    expect(findIndexByX(data, 15.5)).to.be(3);
    expect(findIndexByX(data, 15.5001)).to.be(3);
    expect(findIndexByX(data, 16)).to.be(3);
    expect(findIndexByX(data, 22.9999)).to.be(3);
    expect(findIndexByX(data, 23)).to.be(4);
    expect(findIndexByX(data, 23.0001)).to.be(4);
    expect(findIndexByX(data, 28)).to.be(4);
    expect(findIndexByX(data, 30)).to.be(4);
    expect(findIndexByX(data, 500000)).to.be(4);
  });

  it('findIndexByX returns correct index', () => {
    const data = [
      [ 0 ],
      null,
      [ 15 ],
      [ 16 ],
      [ 30 ]
    ];

    // given an equal distance, it should use the one that exceeded the X value
    expect(findIndexByX(data, -500)).to.be(0);
    expect(findIndexByX(data, 0)).to.be(0);
    expect(findIndexByX(data, 5)).to.be(0);
    expect(findIndexByX(data, 7.4999)).to.be(0);
    expect(findIndexByX(data, 7.5)).to.be(2);
    expect(findIndexByX(data, 7.5001)).to.be(2);
    expect(findIndexByX(data, 15)).to.be(2);
    expect(findIndexByX(data, 15.4999)).to.be(2);
    expect(findIndexByX(data, 15.5)).to.be(3);
    expect(findIndexByX(data, 15.5001)).to.be(3);
    expect(findIndexByX(data, 16)).to.be(3);
    expect(findIndexByX(data, 22.9999)).to.be(3);
    expect(findIndexByX(data, 23)).to.be(4);
    expect(findIndexByX(data, 23.0001)).to.be(4);
    expect(findIndexByX(data, 28)).to.be(4);
    expect(findIndexByX(data, 30)).to.be(4);
    expect(findIndexByX(data, 500000)).to.be(4);
  });
});
