import expect from 'expect.js';
import getLastValue from '../get_last_value';

describe('monitoringChartGetLastValue', function () {
  it('throws error if given more than a single parameter', () => {
    function testError() {
      return getLastValue(0, 1);
    }
    expect(testError).to.throwException();
  });

  it('getLastValue for single number', () => {
    expect(getLastValue(3)).to.be(3);
  });

  it('return 0 for non-number / non-array', () => {
    expect(getLastValue('hello')).to.be(0);
    expect(getLastValue(undefined)).to.be(0);
    expect(getLastValue(null)).to.be(0);
  });

  it('return last `y` value for plot data, or zero', () => {
    const plotData1 = [ [0, 100], [1, 200], [2, 300], [3, 400], [4, 500] ];
    expect(getLastValue(plotData1)).to.be(500);

    const plotData2 = [ [0, 100], [1, 200], [2, 300], [3, 400], [4, 0] ];
    expect(getLastValue(plotData2)).to.be(0);

    const plotData3 = [ [0, 100], [1, 200], [2, 300], [3, 400], [4, -1] ];
    expect(getLastValue(plotData3)).to.be(-1);

    const plotData4 = [ [0, 100], [1, 200], [2, 300], [3, 400], [4, undefined] ];
    expect(getLastValue(plotData4)).to.be(0);

    const plotData5 = [ [0, 100], [1, 200], [2, 300], [3, 400], [4, null] ];
    expect(getLastValue(plotData5)).to.be(0);
  });

});
